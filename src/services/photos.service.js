const httpStatus = require('http-status');
const sharp = require('sharp');
const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);
const { Photos } = require('../models');
const ApiError = require('../utils/ApiError');

const s3 = new S3({
  region: process.env.AWS_DEFAULT_REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const uploadToS3 = (path, newName, bucket) => {
  // Read content from the file
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const fileStream = fs.createReadStream(path);

  // Setting up S3 upload parameters
  const params = {
    Bucket: bucket,
    Key: newName,
    Body: fileStream,
  };

  // Uploading files to the bucket
  return s3.upload(params).promise();
};

const uploadPhoto = async (obj, file, isDraft = false) => {
  const str = obj.title.replaceAll(' ', '_');
  const fileNameMain = `${str}_main_${Date.now()}`;
  const fileNameThumb = `${str}_thumb_${Date.now()}`;

  try {
    const bucketMain = process.env.AWS_BUCKET_MAIN;
    const photo = await uploadToS3(file.path, fileNameMain, bucketMain);

    // upload thumbnails
    const thumbWebp = await sharp(file.path)
      .resize(300, 300)
      .toFile(`uploads/${fileNameThumb}.webp`);
    const thumbnailPath = `uploads/${fileNameThumb}.webp`;

    const bucketThumbnail = process.env.AWS_BUCKET_THUMBNAILS;
    const thumbnail = await uploadToS3(thumbnailPath, fileNameThumb, bucketThumbnail);

    const meta = await sharp(file.path).metadata();

    await unlinkAsync(file.path);
    await unlinkAsync(thumbnailPath);

    const photoData = {
      url: photo.Location,
      thumbnail: thumbnail.Location,
      description: obj.description,
      title: obj.title,
      tags: obj.tags,
      year: obj.year,
      month: obj.month,
      meeting_id: obj.meeting_id,
      metadata: meta,
    };

    if (!isDraft) {
      photoData.is_published = true;
    }
    return await Photos.create({ ...photoData });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getPhotos = async (options) => {
  try {
    return await Photos.paginate({ is_published: true, is_private: false }, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  uploadPhoto,
  getPhotos,
};