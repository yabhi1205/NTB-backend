const sendotp = async (Email, Otp) => {
    require('dotenv/config')
    const userkanaam = process.env.userkanaam
    const sabkapass = process.env.PASSWORD
    const nodemailer = require("nodemailer");
    return new Promise(function (resolve, reject) {
        let transporter = nodemailer.createTransport({
            service: "outlook",
            auth: {
                user: userkanaam,
                pass: sabkapass
            },
        });

        const option = {
            from: userkanaam,
            to: Email,
            subject: "Hello ✔",
            text: Otp.toString(),
        }
        // transporter.sendMail(option, async (error, info) => {
        //     if (info) {
        //     }
        //     else {
        //         reject(error)
        //     }
        // })
                resolve("success")
    })
}
module.exports = sendotp