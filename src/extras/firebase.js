const admin = require('firebase-admin');
require ('firebase-admin/lib/storage');

admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": process.env.PROJECT_ID,
        "private_key_id": process.env.PRIVATE_KEY_ID,
        "private_key": process.env.PRIVATE_KEY,
        "client_email": process.env.CLIENT_EMAIL,
        "client_id": process.env.CLIENT_ID,
        "auth_uri": process.env.AUTH_URI,
        "token_uri": process.env.TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER,
        "client_x509_cert_url": process.env.CLIENT_CERT_URL
      }),
    storageBucket: process.env.STORAGE
})

async function deleteImage(origin, fileName) {
    try {
        if (origin === 'profilePictures') await admin.storage().bucket().file(`profilePictures/${fileName}ProfilePic`).delete();
        if (origin === 'testsProfilePictures') await admin.storage().bucket().file(`testsProfilePictures/${fileName}ProfilePic`).delete();
        if (origin === 'pets' && fileName) await admin.storage().bucket().file(`petsPictures/${fileName}`).delete();
        if (origin === 'testsPets') await admin.storage().bucket().file(`testsPetsPictures/${fileName}`).delete();
        if (origin === 'deletePet') await admin.storage().bucket().file(`petsPictures/${fileName}`).delete();
    } catch (e) {
        return 'Sorry, we could not delete the image';
    }
}

module.exports.deleteImage = deleteImage;
module.exports.admin = admin;

// export async function uploadConfirmedImage(username, imageAsFile) {
//     try {
//         await app.storage().ref(`/profilePictures/${username}ProfilePic`).put(imageAsFile)
//         const url = await app.storage().ref('profilePictures').child(`${username}ProfilePic`).getDownloadURL()
//         return url
//     } catch (e) {
//         return 'Sorry, we could not save your new profile picture'
//     }
// }

// export async function uploadPetImage(pet, imageAsFile) {
//     try {
//         await app.storage().ref(`/testsPetsPictures/${pet}`).put(imageAsFile)
//         const url = await app.storage().ref('testsPetsPictures').child(`${pet}`).getDownloadURL()
//         return url
//     } catch (e) {
//         return 'Sorry, we could not upload your pet picture'
//     }
// }

// export async function uploadConfirmedPetImage(pet, imageAsFile) {
//     try {
//         await app.storage().ref(`/petsPictures/${pet}`).put(imageAsFile)
//         const url = await app.storage().ref('petsPictures').child(`${pet}`).getDownloadURL()
//         return url
//     } catch (e) {
//         return 'Sorry, we could not save your pet picture'
//     }
// }