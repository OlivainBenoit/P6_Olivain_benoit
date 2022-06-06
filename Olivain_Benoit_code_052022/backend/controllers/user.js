const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

let emailRegex = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9._\-]+\.[a-zA-Z]{2,4}$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;

exports.signup = (request, response) => {
  if (!request.body.email.match(emailRegex)) {
    return response.status(400).json({ error: "E-mail non valide" });
  }
  if (!request.body.password.match(passwordRegex)) {
    return response.status(400).json({
      error:
        "Le mot de passe doit contenir 8 caractères minimum, avec un chiffre, une lettre minuscule et une lettre majuscule et aucun caractères spéciaux",
    });
  }
  bcrypt
    .hash(request.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: request.body.email,
        password: hash,
      });
      user
        .save()
        .then(() =>
          response.status(201).json({ message: "Utilisateur crée !" })
        )
        .catch((error) =>
          response.status(400).json({ error: "Mauvais e-mail" })
        );
    })
    .catch((error) => response.status(500).json({ error }));
};

exports.login = (request, response) => {
  User.findOne({ email: request.body.email })
    .then((user) => {
      if (!user) {
        return response.status(401).json({ error: "Utilisateur non trouvé" });
      }
      bcrypt
        .compare(request.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return response
              .status(401)
              .json({ error: "Mot de passe incorrect" });
          }
          response.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => response.status(500).json({ error }));
    })
    .catch((error) => response.status(500).json({ error }));
};
