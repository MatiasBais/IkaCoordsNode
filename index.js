const express = require('express');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const apiRoutes = require('./api'); // Assuming your API routes are in a file named api.js


const app = express();
app.use(cors());
app.use('/api', apiRoutes.router);
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');


// Serve static files (styles.css)
app.use(express.static(path.join(__dirname, '')));
// Routes
app.get('/', (req,res)=>{
  res.render('layout',{title:"IkaCoords",sidebar:'partials/sidebars/searchSideBar.ejs', formPartial: 'partials/search.ejs' })
});




//searchs

app.get('/search', (req,res)=>{
  res.render('layout',{title:"IkaCoords",sidebar:'partials/sidebars/searchSideBar.ejs', formPartial: 'partials/search.ejs' })
});

app.get('/search/cities', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/searchSideBar.ejs', formPartial: 'partials/filterCities.ejs' });
});

app.get('/search/players', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/searchSideBar.ejs', formPartial: 'partials/filterPlayers.ejs' });
});

app.get('/player/:Server/:ID', async (req, res) => {
  try {
      const playerId = req.params.ID;
      const servidor = req.params.Server;
      const playerInfo = await apiRoutes.getPlayerInfo(playerId, servidor); // Assuming getPlayerInfoFromAPI is an asynchronous function that fetches player info from the API

      res.render('layout', {
          title: 'IkaCoords',
          sidebar: 'partials/sidebars/searchSideBar.ejs',
          formPartial: 'partials/playerInfo.ejs',
          player: playerInfo // Pass player info to the template
      });
  } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/alianza/:Server/:ID', async (req, res) => {
  try {
      const alianzaID = req.params.ID;
      const servidor = req.params.Server;
      const alianzaInfo = await apiRoutes.getAlianzaInfo(alianzaID, servidor); 

      res.render('layout', {
          title: 'IkaCoords',
          sidebar: 'partials/sidebars/searchSideBar.ejs',
          formPartial: 'partials/alianzaInfo.ejs',
          alianza: alianzaInfo 
      });
  } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/isla/:Server/:ID', async (req, res) => {
  try {
      const islaID = req.params.ID;
      const servidor = req.params.Server;
      const islaInfo = await apiRoutes.getIslaInfo(islaID, servidor);

      res.render('layout', {
          title: 'IkaCoords',
          sidebar: 'partials/sidebars/searchSideBar.ejs',
          formPartial: 'partials/islaInfo.ejs',
          isla: islaInfo 
      });
  } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/search/inactives', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/searchSideBar.ejs', formPartial: 'partials/filterInactives.ejs' });
});

app.get('/search/islands', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/searchSideBar.ejs', formPartial: 'partials/filterIslands.ejs' });
});

app.get('/tops/bestPlayers', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/topSideBar.ejs', formPartial: 'partials/topPlayers.ejs' });
});

app.get('/tops/worstPlayers', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/topSideBar.ejs', formPartial: 'partials/flopPlayers.ejs' });
});

app.get('/tops/bestAlianzas', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/topSideBar.ejs', formPartial: 'partials/topAlianzas.ejs' });
});

app.get('/tops/worstAlianzas', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/topSideBar.ejs', formPartial: 'partials/flopAlianzas.ejs' });
});

app.get('/statistics/clasiPlayer', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/statisticsSideBar.ejs', formPartial: 'partials/clasiPlayer.ejs' });
});

app.get('/statistics/clasiAlianza', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/statisticsSideBar.ejs', formPartial: 'partials/clasiAlianza.ejs' });
});

app.get('/statistics/masCiudades', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/statisticsSideBar.ejs', formPartial: 'partials/masCiudades.ejs' });
});

app.get('/statistics/mayorIntendencia', (req, res) => {
  res.render('layout', { title: 'IkaCoords',sidebar:'partials/sidebars/statisticsSideBar.ejs', formPartial: 'partials/mayorNivel.ejs' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});