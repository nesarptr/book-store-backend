exports.extractProductBody = (body) => {
  const name = body.name;
  const price = body.price;
  const description = body.description;
  const imgURL = body.imgURL;
  const owner = body.userId;
  return {
    name,
    price,
    description,
    imgURL,
    owner,
  };
};
