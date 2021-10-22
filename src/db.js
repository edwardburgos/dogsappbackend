require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false, // set to console.log to see the raw SQL queries
  native: false, // lets Sequelize know we can use pg-native for ~30% more speed. true / false. 
});
const basename = path.basename(__filename);

const modelDefiners = [];

// Leemos todos los archivos de la carpeta Models, los requerimos y agregamos al arreglo modelDefiners
fs.readdirSync(path.join(__dirname, '/models'))
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)));
  });

// Injectamos la conexion (sequelize) a todos los modelos
modelDefiners.forEach(model => model(sequelize));
// Capitalizamos los nombres de los modelos ie: product => Product
let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]]);
sequelize.models = Object.fromEntries(capsEntries);

// En sequelize.models están todos los modelos importados como propiedades
// Para relacionarlos hacemos un destructuring
const { Dog, Temperament, DogTemperament, Pet, User, Like} = sequelize.models;

// Acá podemos definir hooks
// Dog.addHook('afterBulkCreate', 'connectTemperaments', user => {
// });

// Acá definimos relaciones
Dog.belongsToMany(Temperament, {through: "dogtemperament"});
Temperament.belongsToMany(Dog, {through: "dogtemperament"});
User.hasMany(Pet, {foreignKey: { allowNull: false }, onDelete: 'cascade', hooks: true}); 
User.hasMany(Like, {foreignKey: { allowNull: false }, onDelete: 'cascade', hooks: true}); 
Dog.hasMany(Pet, {foreignKey: { allowNull: false }}); 
Pet.hasMany(Like, {foreignKey: { allowNull: false }}); 
Pet.belongsTo(User); 
Like.belongsTo(User); 
Pet.belongsTo(Dog); 

module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
  conn: sequelize,     // para importart la conexión { conn } = require('./db.js');
};
