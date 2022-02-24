const httpStatus = require('http-status');
const sharp = require('sharp');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { PhotoService } = require('../services');

const createPhoto = catchAsync(async (req, res) => {
  const photo = await PhotoService.uploadPhoto(req.body, req.file);
  res.status(httpStatus.CREATED).json({
    status: httpStatus.CREATED,
    message: 'Photo uploaded successfully',
    data: photo,
  });
});

const createDraft = catchAsync(async (req, res) => {
  const photo = await PhotoService.uploadPhoto(req.body, req.file, true);
  res.status(httpStatus.CREATED).json({
    status: httpStatus.CREATED,
    message: 'Draft created!',
    data: photo,
  });
});

const getPhotos = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (req.query.sortBy === 'oldest') {
    options.sortBy = 'asc';
  } else {
    options.sortBy = 'desc';
  }
  const photos = await PhotoService.getPhotos(options);
  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Photos fetched successfully',
    photos,
  });
});

module.exports = {
  createPhoto,
  createDraft,
  getPhotos,
};
