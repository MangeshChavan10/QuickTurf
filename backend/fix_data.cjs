const mongoose = require('mongoose');
require('dotenv').config();

const turfSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  name: String,
  isApproved: Boolean,
  isFeatured: Boolean
});

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  isApproved: Boolean
});

const Turf = mongoose.models.Turf || mongoose.model('Turf', turfSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function fixData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickturf');
    
    const email = "mangeshchavan374@gmail.com";
    let user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found, creating...');
      user = new User({
        email,
        role: 'admin',
        isApproved: true
      });
      await user.save();
    } else {
      console.log('User found, updating role...');
      user.role = 'admin';
      user.isApproved = true;
      await user.save();
    }
    
    console.log('Updating turf owner...');
    await Turf.updateMany(
      { name: "Match Point Turf" },
      { 
        $set: { 
          ownerId: user._id,
          isApproved: true,
          isFeatured: true
        } 
      }
    );
    
    console.log('Data fixed successfully!');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixData();
