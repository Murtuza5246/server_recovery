const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
let ObjectId = require('mongodb').ObjectID;
const instagram_download = require('@juliendu11/instagram-downloader');
const cheerio = require('cheerio');
const axios = require('axios');

router.get('/', async (req, res) => {
	const url = req.query.link;

	const html = await axios.get(url);
	const $ = cheerio.load(html.data);
	const videoString = $("meta[property='og:video']").attr('content');
	const imageString = $("meta[property='og:image']").attr('content');
	let linkObject = {
		videoString,
		imageString
	};
	console.log(linkObject);
	return res.status(200).json(linkObject);
	// return res.status(200).json({ $ });
});
router.get('/fb/', (req, res) => {
	const url = req.query.link;
	//dfrfierivberv
	//vrevuervubwirevbkebrvbre
	//vrevuervubwirevbkebrvbre
	//vrevuervubwirevbkebrvbre
	//vrevuervubwirevbkebrvbre
	//vrevuervubwirevbkebrvbre
	require('fb-video-downloader').getInfo(url).then((info) => res.status(200).json(JSON.stringify(info, null, 2)));
});

module.exports = router;
