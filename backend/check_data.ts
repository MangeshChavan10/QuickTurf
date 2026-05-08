import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const turfSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  name: String,
});

const userSchema = new mongoose.Schema({
  email: String,
});

const Turf = mongoose.models.Turf || mongoose.model('Turf', turfSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickturf');
  const turfs = await Turf.find({});
  const users = await User.find({});
  
  console.log('Total Turfs:', turfs.length);
  turfs.forEach(t => console.log(`Turf: ${t.name}, OwnerId: ${t.ownerId}`));
  
  console.log('Total Users:', users.length);
  users.forEach(u => console.log(`User: ${u.email}, Id: ${u._id}`));
  
  await mongoose.disconnect();
}

checkData();
