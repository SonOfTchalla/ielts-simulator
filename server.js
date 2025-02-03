const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();
const upload = multer({ dest: 'uploads/' });

require('dotenv').config();

//API Keys
const SPEECH_TO_TEXT_API_KEY = process.env.OPENAI_API_KEY;
const LLM_API_KEY = process.env.STT_API_KEY;

