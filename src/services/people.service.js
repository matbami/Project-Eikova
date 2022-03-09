const httpStatus = require('http-status');
const { People } = require('../models');
const ApiError = require('../utils/ApiError');

const getPeople = async () => {
  const people = await People.find({});
  if (!people) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No People found');
  }
  return people;
};

const createPeople = async (people, user) => {
  const existingPeople = await People.findOne({ people });
  if (existingPeople) {
    throw new ApiError(httpStatus.CONFLICT, 'People already exists');
  }
  const data = { name: people, author: user };
  return await People.create(data);
};

const searchPeople = async (people) => {
  const peoples = await People.find({ name: { $regex: people, $options: 'i' } }).limit(10);
  if (!peoples) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No People found');
  }
  return peoples;
};

const getPerson = async (personId) => {
  const person = await People.findById(personId);
  if (!person) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }
  return person;
};

const updatePeople = async (peopleId, peopleBody) => {
  const people = { name: peopleBody.name };
  const response = await People.findByIdAndUpdate(peopleId, people, { new: true });
  if (!response) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }
  return response;
};

const deletePeople = async (peopleId) => {
  const people = await People.findByIdAndDelete(peopleId);
  if (!people) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }
  return people;
};

module.exports = {
  getPeople,
  createPeople,
  searchPeople,
  getPerson,
  updatePeople,
  deletePeople,
};