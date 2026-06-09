const HEX = '0123456789abcdef';

const generateObjectId = () => {
  let id = '';
  for (let i = 0; i < 24; i += 1) {
    id += HEX[Math.floor(Math.random() * 16)];
  }
  return id;
};

export default generateObjectId;
