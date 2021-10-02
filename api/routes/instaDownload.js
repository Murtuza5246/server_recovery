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
});

module.exports = router;
