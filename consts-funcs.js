const { "default": makeWaSocket, downloadContentFromMessage } = require('@whiskeysockets/baileys');

const axios = require('axios');

const path = require('path');

const fs = require('fs-extra');

const os = require('os');

const https = require('https'); 

const Banner = require("@cognima/banners");

const cron = require('node-cron');

const FormData = require('form-data');

const { exec, execSync } = require('child_process');


const API_KEY_BRONXYS = "Yosuke-5050P";


const menu = require(`./dono/menus/menu.js`);
const menuadm  = require(`./dono/menus/menuadm.js`);
const menubn = require(`./dono/menus/brincadeiras.js`);
const menuDono = require(`./dono/menus/menudono.js`);
const menuAlterador = require(`./dono/menus/alteradores.js`);


async function fetchJson(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'pt-BR'
    }
  });
  return response.data;
}

function formatUptime(seconds, longFormat = false, showZero = false) {
  const d = Math.floor(seconds / (24 * 3600));
  const h = Math.floor((seconds % (24 * 3600)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const formats = longFormat ? { d: (val) => `${val} ${val === 1 ? 'dia' : 'dias'}`, h: (val) => `${val} ${val === 1 ? 'hora' : 'horas'}`, m: (val) => `${val} ${val === 1 ? 'minuto' : 'minutos'}`, s: (val) => `${val} ${val === 1 ? 'segundo' : 'segundos'}` } : { d: (val) => `${val}d`, h: (val) => `${val}h`, m: (val) => `${val}m`, s: (val) => `${val}s` };
  const uptimeStr = [];
  if (d > 0 || showZero) uptimeStr.push(formats.d(d));
  if (h > 0 || showZero) uptimeStr.push(formats.h(h));
  if (m > 0 || showZero) uptimeStr.push(formats.m(m));
  if (s > 0 || showZero) uptimeStr.push(formats.s(s));
  return uptimeStr.length > 0 ? uptimeStr.join(longFormat ? ', ' : ' ') : (longFormat ? '0 segundos' : '0s');
};


module.exports = { 
  
axios, path, fs, os, https, Banner, cron, FormData, API_KEY_BRONXYS, exec, execSync, fetchJson, formatUptime,


menu, menuadm, menubn, menuDono, menuAlterador
}