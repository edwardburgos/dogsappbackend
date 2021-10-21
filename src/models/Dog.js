const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('dog', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    heightmax: {
      type: DataTypes.INTEGER,
    },
    heightmin: {
      type: DataTypes.INTEGER,
    },
    weightmax: {
      type: DataTypes.INTEGER,
    },
    weightmin: {
      type: DataTypes.INTEGER,
    },
    lifespanmax: {
      type: DataTypes.INTEGER,
    },
    lifespanmin: {
      type: DataTypes.INTEGER,
    },
    bred_for: {
      type: DataTypes.STRING,
    },
    breed_group: {
      type: DataTypes.STRING,
    },
    origin: {
      type: DataTypes.STRING,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  });


};


// {nombre, heightmax, heightmin, weightmax, weightmin, temperaments} = req.body;