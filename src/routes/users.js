const { Router } = require('express');
const axios = require('axios').default;
const { User, Pet, Dog, Temperament, Like } = require('../db.js');
const utils = require('../extras/utils.js');
const countries = require('../extras/countries')
const passport = require('passport');
const { Op } = require('sequelize');
const router = Router();
const { deleteImage } = require('../extras/firebase')
const { sendMail } = require('../extras/nodemailer')

// This route allows us to get the email, photo and name of the authentciated user
router.get('/info', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { id, fullname, name, lastname, profilepic, username, country, email, dogs, pets, type, likes } = req.user;
    res.status(200).json({ success: true, msg: "You are successfully authenticated to this route!", user: { id, fullname, name, lastname, profilepic, username, country, email, type, pets: pets.map(e => e.dataValues.id), likes } });
});

// This route allows us to delete an user account
router.delete('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    if (req.user.type === 'Google') {
        try {
            const user = await User.findOne({ where: { id: req.user.id } })
            if (user) {
                const username = user.username;
                await user.destroy();
                deleteImage('profilePictures', username);
                return res.send('Your account was deleted successfully')
            } else {
                return res.status(404).send(`There is no user with the id ${id}`)
            }
        } catch (e) {
            next()
        }
    } else {
        if (utils.validPassword(req.body.password, req.user.hash, req.user.salt)) {
            try {
                const user = await User.findOne({ where: { id: req.user.id } })
                if (user) {
                    const username = user.username;
                    await user.destroy();
                    deleteImage('profilePictures', username);
                    return res.send('Your account was deleted successfully')
                } else {
                    return res.status(404).send(`There is no user with the id ${id}`)
                }
            } catch (e) {
                next()
            }
        } else {
            return res.status(401).send('Incorrect password')
        }
    }
})

// This route allows us to send an email to delete an account
router.post('/deleteAccountEmail', async (req, res, next) => {
    const { emailUsername } = req.body
    const user = await User.findOne({
        where: {
            [Op.or]:
                [
                    { email: emailUsername },
                    { username: emailUsername }
                ]
        }
    })
    if (user) {
        const tokenObject = utils.issueJWT(user, 'deleteAccountEmail');
        const status = await sendMail(user.name, user.email, 'deleteAccountEmail', tokenObject)
        if (status !== 'Sorry, an error ocurred') return res.send(true)
        return next()
    } else {
        return res.status(404).send({ success: false, msg: "There is no user registered with this email" });
    }
})

// This route returns true (if there is no user with that email) OR false is there is one
router.get('/availableEmail/:email', async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { email: req.params.email } });
        return res.send(user ? false : true);
    } catch (e) {
        next()
    }
})

router.get('/communityAll', async (req, res) => {
    const community = await User.findAll({ attributes: ['fullname', 'profilepic', 'username', 'country'], order: [ [ 'createdAt', 'desc' ] ]})
    res.send(community)
})

// This route allows us to get the username, fullname, country, photo, dogs and pets of the especified user
router.get('/:username', async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { username: req.params.username },
            include: [
                {
                    model: Pet,
                    as: "pets",
                    include: [
                        {
                            model: Like,
                            as: "likes",
                            include: [
                                {
                                    model: User,
                                    as: "user"
                                }
                            ]
                        },
                        {
                            model: Dog,
                            as: "dog"
                        }
                    ]
                }
            ],
            order: [
                [{ model: Pet, as: 'pets' }, 'createdAt', 'DESC'],
                [{ model: Pet, as: 'pets' }, { model: Like, as: 'likes' }, 'createdAt', 'DESC']
            ]
        })
        if (user) {
            let { fullname, profilepic, country, username, pets, dogs } = user.dataValues;
            pets = pets.map(e => Object.assign((({ id, name, photo, dog, likes }) => ({ id, name, photo, dog, likes }))(e.dataValues), { likes: e.dataValues.likes.map(e => e.dataValues ? (({ id, username, fullname, profilepic }) => ({ id, username, fullname, profilepic }))(e.dataValues.user) : null) }, { likesCount: e.dataValues.likes.length }, { dog: (({ id, name }) => ({ id, name }))(e.dataValues.dog) }));
            return res.send({ fullname, profilepic, country, username, pets, dogs })
        } else {
            return res.status(500).send('User not found')
        }
    } catch (e) {
        console.log(e)
        next();
    }
})

// This route allows us to register a new user
router.post('/register', async (req, res, next) => {
    let { fullname, name, lastname, profilepic, username, country, email, password, type } = req.body;
    if (!countries.map(c => c.name).includes(country)) return res.status(406).send({ success: false, msg: 'This is not a country' })
    try {
        const availableUsername = await User.findOne({ where: { username } })
        if (!availableUsername) {
            const availableEmail = await User.findOne({ where: { email } })
            if (!availableEmail) {
                if (!profilepic) profilepic = 'https://firebasestorage.googleapis.com/v0/b/dogsapp-f043d.appspot.com/o/defaultProfilePic.jpg?alt=media&token=cfd199e8-c010-45ab-972b-c967c55f3461';
                const saltHash = utils.genPassword(password);
                const salt = saltHash.salt;
                const hash = saltHash.hash;
                const user = await User.create({ fullname, name, lastname, profilepic, username, country, email, hash, salt, type, verified: type === 'Google' ? true : false });
                if (user) {
                    if (type === 'Native') {
                        const tokenObject = utils.issueJWT(user, 'verifyEmail');
                        const status = await sendMail(user.name, user.email, 'verifyEmail', tokenObject)
                        if (status !== 'Sorry, an error ocurred') return res.send({ success: true, user: user.name })
                        return next()
                    } else {
                        return res.send({ success: true, user: user.name });
                    }
                } else {
                    return res.status(400).send({ success: false, msg: 'Sorry, an error occurred' })
                }
            } else { return res.status(409).send({ success: false, msg: 'There is already a user with this email' }) }
        } else { res.status(409).send({ success: false, msg: 'There is already a user with this username' }) }
    } catch (e) {
        console.log(e)
        next()
    }
})

// This route allows us to send another verification link to the user
router.post('/newVerificationEmail', async (req, res, next) => {
    const { emailUsername } = req.body
    const user = await User.findOne({
        where: {
            [Op.or]:
                [
                    { email: emailUsername },
                    { username: emailUsername }
                ]
        }
    })
    if (user) {
        if (user.type === "Native") {
            if (user.verified) {
                res.status(403).send({ success: false, msg: "This user is already verified" });
            } else {
                const tokenObject = utils.issueJWT(user, 'verifyEmail');
                const status = await sendMail(user.name, user.email, 'verifyEmail', tokenObject)
                if (status !== 'Sorry, an error ocurred') return res.send(true)
                return next()
            }
        } else if (user.type === "Google") {
            res.status(403).send({ success: false, msg: `You were registered with ${user.type}, if you want define a password, log in with other email or log in with ${user.type} again` });
        }
    } else {
        return res.status(404).send({ success: false, msg: "There is no user registered with this email" });
    }
})

// This route allows us to mark an user as verified
router.put('/verifyUser', async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { email: req.body.email } })
        if (user) {
            if (user.verified) {
                res.send('Already verified')
            } else {
                await user.update({ verified: true })
                res.send('Verified')
            }
        } else {
            res.status(404).send("There is no user registered with this email");
        }
    } catch (e) {
        next()
    }
})

// This route allows us to login without password
router.post('/loginWithoutPassword', async (req, res, next) => {
    const { emailUsername } = req.body
    const user = await User.findOne({
        where: {
            [Op.or]:
                [
                    { email: emailUsername },
                    { username: emailUsername }
                ]
        }
    })
    if (user) {
        const tokenObject = utils.issueJWT(user, 'loginWithoutPassword');
        const status = await sendMail(user.name, user.email, 'loginWithoutPassword', tokenObject)
        if (status !== 'Sorry, an error ocurred') return res.send(true)
        return next()
    } else {
        return res.status(404).send({ success: false, msg: "There is no user registered with this email" });
    }
})

// This route allows us to reset password
router.post('/resetPassword', async (req, res, next) => {
    const { emailUsername } = req.body
    const user = await User.findOne({
        where: {
            [Op.or]:
                [
                    { email: emailUsername },
                    { username: emailUsername }
                ]
        }
    })
    if (user) {
        const tokenObject = utils.issueJWT(user, 'resetPassword');
        const status = await sendMail(user.name, user.email, 'resetPassword', tokenObject)
        if (status !== 'Sorry, an error ocurred') return res.send(true)
        return next()
    } else {
        return res.status(404).send({ success: false, msg: "There is no user registered with this email" });
    }
})

// This route allows us to define password
router.post('/definePassword', async (req, res, next) => {
    const { emailUsername } = req.body
    const user = await User.findOne({
        where: {
            [Op.or]:
                [
                    { email: emailUsername },
                    { username: emailUsername }
                ]
        }
    })
    if (user) {
        const tokenObject = utils.issueJWT(user, 'definePassword');
        const status = await sendMail(user.name, user.email, 'definePassword', tokenObject)
        if (status !== 'Sorry, an error ocurred') return res.send(true)
        return next()
    } else {
        return res.status(404).send({ success: false, msg: "There is no user registered with this email" });
    }
})

// This route allows us to log in a user validating if exists and issuing a JWT
router.post('/login', async (req, res, next) => {
    try {
        const { emailORusername, password, type } = req.body;
        if (type === 'Google') {
            const user = await User.findOne({ where: { email: emailORusername } });
            if (user) {
                if (!user.verified) await user.update({verified: true})
                const tokenObject = utils.issueJWT(user);
                res.send({ success: true, user: user.name, token: tokenObject.token, expiresIn: tokenObject.expires });
            } else {
                return res.status(404).send({ success: false, msg: "There is no user registered with this email" });
            }
        } else if (type === 'Native') {
            const user = await User.findOne({
                where: {
                    [Op.or]:
                        [
                            { email: emailORusername },
                            { username: emailORusername }
                        ]
                }
            })
            if (user) {
                if (user.type === "Native") {
                    if (user.verified) {
                        const isValid = utils.validPassword(req.body.password, user.hash, user.salt);
                        if (isValid) {
                            const tokenObject = utils.issueJWT(user);
                            res.send({ success: true, user: user.name, token: tokenObject.token, expiresIn: tokenObject.expires });
                        } else {
                            res.status(403).send({ success: false, msg: "Incorrect password" });
                        }
                    } else {
                        res.status(403).send({ success: false, msg: `Your account is not verified yet` });
                    }
                } else if (user.type === "Google") {
                    res.status(403).send({ success: false, msg: `You were registered with ${user.type}, if you want define a password, log in with other email or log in with ${user.type} again` });
                }
            } else {
                return res.status(404).send({ success: false, msg: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(emailORusername) ? "There is no user registered with this email" : "There is no user registered with this username" });
            }
        }
    } catch (e) {
        next();
    }
});

// This route allows us to change the password
router.post('/definePasswordWithEmail', async (req, res, next) => {
    try {
        const { emailORusername, password } = req.body;
        const user = await User.findOne({
            where: {
                [Op.or]:
                    [
                        { email: emailORusername },
                        { username: emailORusername }
                    ]
            }
        })
        if (user) {
            const saltHash = utils.genPassword(password);
            const salt = saltHash.salt;
            const hash = saltHash.hash;
            const newUser = await user.update({ hash, salt, type: 'Native' });
            if (newUser) {
                const tokenObject = utils.issueJWT(newUser);
                res.send({ success: true, user: user.name, token: tokenObject.token, expiresIn: tokenObject.expires });
            } else {
                return res.status(500).send({ success: false, msg: "Password could not be defined" });
            }
        } else {
            return res.status(404).send({ success: false, msg: "There is no user registered with this email" });
        }
    } catch (e) {
        console.log(e);
        next();
    }
})

// This route allows us to change the password
router.post('/changeCurrentPassword', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const { newPassword, currentPassword } = req.body;
        if (utils.validPassword(currentPassword, req.user.hash, req.user.salt)) {
            const saltHash = utils.genPassword(newPassword)
            if (utils.validPassword(newPassword, req.user.hash, req.user.salt)) return res.status(409).send('Provide a password different from your current password')
            const user = await User.findOne({ where: { id: req.user.id } })
            if (user) {
                const updated = await user.update({ salt: saltHash.salt, hash: saltHash.hash });
                return updated ? res.send('Your password was updated successfully') : next()
            } else {
                return res.status(404).send(`There is no user with the id ${id}`)
            }
        } else {
            return res.status(401).send('Incorrect password')
        }
    } catch (e) {
        console.log(e)
        next();
    }
})

router.post('/changePasswordWithEmail', async (req, res, next) => {
    try {
        const { newPassword, email } = req.body;
        const saltHash = utils.genPassword(newPassword)
        const user = await User.findOne({ where: { email}})
        if (user) {
            if (utils.validPassword(newPassword, user.hash, user.salt)) return res.status(409).send('Provide a password different from your current password')
            const newUser = await user.update({ salt: saltHash.salt, hash: saltHash.hash });
            if (newUser) {
                const tokenObject = utils.issueJWT(newUser);
                res.send({ success: true, user: user.name, token: tokenObject.token, expiresIn: tokenObject.expires });
            } else {
                return res.status(500).send({ success: false, msg: "Password could not be updated" });
            }
        } else {
            return res.status(404).send(`There is no user with the email ${email}`)
        }
    } catch (e) {
        console.log(e)
        next();
    }
})

router.put('/changePhoto', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: req.user.id } });
        if (user) {
            const updated = await user.update({ profilepic: req.body.profilePic })
            if (updated) {
                deleteImage('testsProfilePictures', user.username);
                return res.send('Your profile picture was updated successfully');
            } else {
                return res.status(500).send('Sorry, your profile picture could not be updated')
            }
        } else { return res.status(404).send('User not found') }
    } catch (e) {
        next()
    }
})

router.put('/updateUserInfo', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const { name, lastname, username, country } = req.body;
        const user = await User.findOne({ where: { id: req.user.id } });
        if (user) {
            const userAvailability = await User.findOne({ where: { username } });
            if (userAvailability && (JSON.stringify(user) !== JSON.stringify(userAvailability))) return res.status(409).send('There is already a user with this username')
            const updated = await user.update({ fullname: `${name} ${lastname}`, name, lastname, username, country });
            return updated ? res.send(`${updated.name} your information was updated successfully`) : res.status(500).send('Sorry, your information could not be updated')
        } else { return res.status(404).send('User not found') }
    } catch (e) {
        next()
    }
})

router.delete('/notUsed/:photoImageName', async (req, res) => {
    deleteImage('testsProfilePictures', req.params.photoImageName)
})

module.exports = router;