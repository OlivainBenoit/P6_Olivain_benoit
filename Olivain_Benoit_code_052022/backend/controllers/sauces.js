const Sauce = require("../models/sauces");
const fs = require("fs");
const { request } = require("http");
// const jwt = require("jsonwebtoken");

exports.createSauces = (request, response) => {
  const sauceObject = JSON.parse(request.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${request.protocol}://${request.get("host")}/images/${
      request.file.filename
    }`,
  });
  sauce
    .save()
    .then(() => response.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => response.status(400).json({ error }));
};

exports.modifySauces = (request, response) => {
  const sauceObject = request.file
    ? {
        ...JSON.parse(request.body.sauce),
        imageUrl: `${request.protocol}://${request.get("host")}/images/${
          request.file.filename
        }`,
      }
    : { ...request.body };
  Sauce.findOne({ _id: request.params.id })
    .then((sauce) => {
      if (request.auth.userId !== sauce.userId) {
        return response.status(401).json({ message: "Requete non autorisée" });
      }
      if (request.file !== undefined) {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {});
      }
      Sauce.updateOne(
        { _id: request.params.id },
        { ...sauceObject, _id: request.params.id }
      )
        .then(() => response.status(200).json({ message: "Objet modifié" }))
        .catch((error) => response.status(400).json({ error }));
    })
    .catch((error) => response.status(500).json({ error }));
};

exports.deleteSauces = (request, response) => {
  Sauce.findOne({ _id: request.params.id })
    .then((sauce) => {
      // const token = request.headers.authorization.split(" ")[1];
      // const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET");
      if (/*decodedToken.userId*/ request.auth.userId !== sauce.userId) {
        return response.status(401).json({ message: "Requete non autorisée" });
      }
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: request.params.id })
          .then(() => response.status(200).json({ message: "Objet supprimé" }))
          .catch((error) => response.status(400).json({ error }));
      });
    })
    .catch((error) => response.status(500).json({ error }));
};

exports.getOneSauces = (request, response) => {
  Sauce.findOne({ _id: request.params.id })
    .then((sauce) => response.status(200).json(sauce))
    .catch((e) => response.status(404).json({ e }));
};

exports.getAllSauces = (request, response) => {
  Sauce.find()
    .then((sauces) => response.status(200).json(sauces))
    .catch((e) => response.status(400).json({ e }));
};

exports.likeOrDislike = (request, response) => {
  Sauce.findOne({ _id: request.params.id })
    .then((sauce) => {
      const liked = sauce.usersLiked.includes(request.body.userId);
      const disliked = sauce.usersDisliked.includes(request.body.userId);
      if (request.body.like === 0) {
        if (liked) {
          sauce.likes--;
          sauce.usersLiked = sauce.usersLiked.filter(
            (user) => user !== request.body.userId
          );
        }
        if (disliked) {
          sauce.dislikes--;
          sauce.usersDisliked = sauce.usersDisliked.filter(
            (user) => user !== request.body.userId
          );
        }
      }

      if (request.body.like === 1) {
        sauce.likes++;
        sauce.usersLiked.push(request.body.userId);
      }
      if (request.body.like === -1) {
        sauce.dislikes++;
        sauce.usersDisliked.push(request.body.userId);
      }

      Sauce.updateOne({ _id: request.params.id }, sauce)
        .then(() => response.status(200).json({ message: "Objet modifié" }))
        .catch((err) => response.status(400).json({ err }));
    })
    .catch((error) => response.status(400).json({ error }));
};

// exports.likeOrDislike = async (request, response) => {
//   try {
//     const sauce = await Sauce.findOne({ _id: request.params.id });
//     const liked = sauce.usersLiked.includes(request.body.userId);
//     const disliked = sauce.usersDisliked.includes(request.body.userId);
//     if (request.body.like === 0) {
//       if (liked) {
//         sauce.likes--;
//         sauce.usersLiked = sauce.usersLiked.filter(
//           (user) => user !== request.body.userId
//         );
//       }
//       if (disliked) {
//         sauce.dislikes--;
//         sauce.usersDisliked = sauce.usersDisliked.filter(
//           (user) => user !== request.body.userId
//         );
//       }
//     }

//     if (request.body.like === 1) {
//       sauce.likes++;
//       sauce.usersLiked.push(request.body.userId);
//     }
//     if (request.body.like === -1) {
//       sauce.dislikes++;
//       sauce.usersDisliked.push(request.body.userId);
//     }

//     await Sauce.updateOne({ _id: request.params.id }, sauce);

//     response.status(200).json({ message: "Objet modifié" });
//   } catch (e) {
//     response.status(400).send("[Error]: " + e);
//   }
// };

// gitignore images
