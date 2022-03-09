const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { PeopleService } = require('../services');

const createPeople = catchAsync(async (req, res) => {
  const people = await PeopleService.createPeople(req.body.name, req.user.id);
  res.status(httpStatus.CREATED).json({
    status: 'success',
    people,
  });
});

const getAllPeople = catchAsync(async (req, res) => {
  const people = await PeopleService.getPeople();
  res.status(httpStatus.OK).json({
    status: 'success',
    people,
  });
});

const getPerson = catchAsync(async (req, res) => {
  const people = await PeopleService.getPerson(req.params.id);
  if (!people) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: 'fail',
      message: 'Person not found',
    });
  }
  res.status(httpStatus.OK).json({
    status: 'success',
    people,
  });
});

const updatePeople = catchAsync(async (req, res) => {
  const people = await PeopleService.updatePeople(req.params.id, req.body);
  if (!people) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: 'fail',
      message: 'Person not found',
    });
  }
  res.status(httpStatus.OK).json({
    status: 'success',
    people,
  });
});

const deletePeople = catchAsync(async (req, res) => {
  const people = await PeopleService.deletePeople(req.params.id);
  if (!people) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: 'fail',
      message: 'Person not found',
    });
  }
  res.status(httpStatus.OK).json({
    status: 'success',
    people,
  });
});

const searchPeople = catchAsync(async (req, res) => {
  const people = await PeopleService.searchPeople(req.query.name);
  res.status(httpStatus.OK).json({
    status: 'success',
    people,
  });
});

module.exports = {
  createPeople,
  getAllPeople,
  getPerson,
  updatePeople,
  deletePeople,
  searchPeople,
};