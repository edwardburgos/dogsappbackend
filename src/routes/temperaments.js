const { Router } = require('express');
const { Temperament} = require('../db.js');
const router = Router();

// This route allows us to read the existing temperaments
router.get('/', async (req, res, next) => {
    try {
        let temperaments = await Temperament.findAll({order: [ [ 'name', 'asc' ] ]});
        return temperaments ? res.send(temperaments.map((e) => { return e.name })) : next()
    } catch (e) {
        return next()
    }
})

module.exports = router;