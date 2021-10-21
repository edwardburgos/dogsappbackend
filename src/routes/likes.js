const { Router } = require('express');
const axios = require('axios').default;
const { Temperament, Dog, DogTemperament, User, Pet, Like } = require('../db.js');
const utils = require('../extras/utils.js');
const countries = require('../extras/countries')
const passport = require('passport');
const { Op } = require('sequelize');
const router = Router();


// This route allows us to read the existing likes of the given pet
router.get('/:pet', async (req, res, next) => {
    try {
        if (!req.params.pet) return res.status(400).send('Please provide a dog')
        let petFound = await Pet.findOne({
            where: {
                id: req.params.pet
            },
            include: [
                {
                    model: Like,
                    as: "likes",
                },
            ],
        })
        petFound ? res.send({ total: petFound.likes.length, detail: petFound.likes.map(e => e.userId) }) : res.send(`There is no dog with the id ${req.params.pet}`)
    } catch (e) {
        next()
    }
});

// This route allow us to like or dislike a pet
router.post('/:pet', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        if (!req.params.pet) return res.status(400).send('Please provide a dog')
        let petFound = await Pet.findOne({
            where: {
                id: req.params.pet
            }
        })
        if (petFound) {
            const liked = await Like.findOne({
                where: {
                    [Op.and]: [
                        { userId: req.user.id },
                        { petId: req.params.pet }
                    ]
                }
            })
            if (liked) {
                const disliked = await liked.destroy();
                disliked ? res.send(`You disliked the dog with the id ${req.params.pet} successfully`) : res.status(500).send(`Sorry, the dog with the id ${req.params.pet} could not be disliked correctly`)
            } else {
                const created = await Like.create({ userId: req.user.id, petId: req.params.pet });
                created ? res.send(`You liked the dog with the id ${req.params.pet} successfully`) : res.status(500).send(`Sorry, the dog with the id ${req.params.pet} could not be liked correctly`)
            }
        } else {
            res.status(404).send(`There is no dog with the id ${req.params.pet}`)
        }
    } catch (e) {
        next()
    }
})

module.exports = router;