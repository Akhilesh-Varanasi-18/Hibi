// const getISTDateAndTime = (date) => {
//     const currentDate = date ? new Date(date) : new Date();
//     const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
//     const istDate = new Date(currentDate.getTime() + istOffsetInMilliseconds - (currentDate.getTimezoneOffset() * 60000));
//     return istDate;
// }

// module.exports = { getISTDateAndTime };

const getISTDateAndTime = () => {
  const currentDate = new Date();

  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;

  const date = new Date(currentDate.getTime() + istOffsetInMilliseconds);

  return date;
};

const changeGTMtoIST = (date) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const res = new Date(date.getTime() + istOffset);
  return res;
};

module.exports = { 
  getISTDateAndTime,
  changeGTMtoIST
};
