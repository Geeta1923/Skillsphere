const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Gig = require('./models/Gig');

dotenv.config();

const flagExistingSuspicious = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // Flag by budget
        const budgetResult = await Gig.updateMany(
            { budgetMax: { $gt: 500000 }, isSuspicious: false },
            { $set: { isSuspicious: true } }
        );
        console.log(`Flagged ${budgetResult.modifiedCount} high budget gigs.`);

        // Flag by keyword
        const keywords = ['whatsapp', 'telegram', 'contact me', 'payment outside'];
        let keywordCount = 0;
        for (const word of keywords) {
            const res = await Gig.updateMany(
                { 
                    $or: [
                        { title: { $regex: word, $options: 'i' } },
                        { description: { $regex: word, $options: 'i' } }
                    ],
                    isSuspicious: false
                },
                { $set: { isSuspicious: true } }
            );
            keywordCount += res.modifiedCount;
        }
        console.log(`Flagged ${keywordCount} gigs with suspicious keywords.`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

flagExistingSuspicious();
