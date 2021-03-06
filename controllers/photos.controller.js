const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model')

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileNameExtension = fileName.split('.')[1]; // cut extension of the file
      // new pattern for RegExp checking validation of typed data
      const pattern = new RegExp(/(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/, 'g'); 
      
      const authorMatched = author.match(pattern).join(''); // author matched by RegExp pattern
      const titleMatched = title.match(pattern).join(''); // title matched by RegExp pattern
      // RegEx pattern for email
      const emailPattern = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'g');
      const emailMatched = email.match(emailPattern).join(''); // email matched by RegEx pattern 

        // check file extension, author & title length, author & title - correctness of characters, email validation
      if(fileNameExtension === 'jpg' 
          || 
          fileNameExtension === 'gif' 
          || 
          fileNameExtension === 'png' 
          &&
          title.length <= 25 
          &&
          author.length <= 50
          &&
          author.length === authorMatched.length
          &&
          title.length === titleMatched.length
          &&
          emailMatched
          ){
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong input!');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({_id: req.params.id});
    const voter = await Voter.findOne({user: req.clientIp})
    if (!photoToUpdate) res.status(404).json({message: 'Not found'});
    else {
      if (voter) {
        if (voter.votes.includes(photoToUpdate._id)) {
          res.status(500).json({message: 'you can\'t vote again for the same photo'})
        } else {
          voter.votes.push(photoToUpdate._id);
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({message: 'OK'});
        }
      } else {
        const newVoter = new Voter({
          user: req.clientIp,
          votes: [ photoToUpdate._id ]
        });
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({message: 'OK'});
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
