const express = require('express');
const bodyParser = require('body-parser');
const { Alianza, City, Isla, Player, Puntos, Updates} = require('./model.js'); // Adjust the path based on your file structure
const sequelize = require('sequelize');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const db = require('./model.js');

// Alianza Endpoints
router.get('/alianzas', (req, res) => {
  Alianza.findAll().then((alianzas) => {
    res.json(alianzas);
  });
});

router.post('/alianzas', (req, res) => {
  Alianza.create(req.body).then((newAlianza) => {
    res.json(newAlianza);
  });
});

router.get('/alianzas/:id', (req, res) => {
  Alianza.findByPk(req.params.id).then((alianza) => {
    if (!alianza) {
      res.status(404).json({ error: 'Alianza not found' });
    } else {
      res.json(alianza);
    }
  });
});

async function getAlianzaInfo(idAlianza, servidor){
  let maxUpdatePuntos = await Puntos.max('update');
  return Alianza.findByPk(idAlianza,{
    include:{
      model:Player,
      as: 'players',
      where:{server:servidor},
      include:[
        {
          model: Puntos,
          as: 'puntos',
          where:{update:maxUpdatePuntos}
        },
      ]
    },
    where:{server:servidor},
  })
}

// City Endpoints
router.get('/cities', (req, res) => {
  City.findAll().then((cities) => {
    res.json(cities);
  });
});

router.get('/cities/mayorNivel', (req,res)=>{
  let servidor = req.query.servidor;
  let pagina = req.query.pagina;

  let maxUpdatePuntos;
  Puntos.max('update').then(re=>{
    maxUpdatePuntos = re;
    let maxUpdateCiudades;
    City.max('update',{where:{server:servidor}}).then(r=>{
      maxUpdateCiudades=r;

      City.findAll({
        include: [
          // Incluye el modelo Isla asociado a la ciudad
          { model: Isla, as: 'isla', where:{server:servidor} },
          // Incluye el modelo Player asociado a la ciudad
          {
            model: Player,
            as: 'player',
            where:{server:servidor},
            include: [
              // Incluye la alianza asociada al jugador
              { model: Alianza, as: 'alianza', where:{server:servidor} },
              // Incluye los puntos asociados al jugador
              { model: Puntos, as: 'puntos', where:{update:maxUpdatePuntos} },
            ],
          },
        ],
        // Ordena las ciudades por el nivel de la isla en orden ascendente
        where:{server:servidor, update:maxUpdateCiudades},
        order: [['nivel','DESC']],
        limit:50,
        offset:+pagina
      })
      .then(ciudades => {
        res.send(ciudades)
      })

    })
  })

})

router.post('/cities', (req, res) => {
  City.create(req.body).then((newCity) => {
    res.json(newCity);
  });
});

router.get('/cities/:id', (req, res) => {
  City.findByPk(req.params.id).then((city) => {
    if (!city) {
      res.status(404).json({ error: 'City not found' });
    } else {
      res.json(city);
    }
  });
});

// Filter Cities
router.get('/filter-cities', async (req, res) => {
  try {

    
    const servidor = req.query.server;
    const playerName = req.query.playerName;
    const allianceName = req.query.allianceName;
    const xRangeStart = req.query.xRangeStart;
    const xRangeEnd = req.query.xRangeEnd;
    const yRangeStart = req.query.yRangeStart;
    const yRangeEnd = req.query.yRangeEnd;
    const townName = req.query.townName;

    const filterOptions = {};

    if (playerName) {
      filterOptions['$player.nombre$'] = playerName;
    }

    if (allianceName) {
      filterOptions['$player.alianza.nombre$'] = allianceName;
    }

    if (xRangeStart && xRangeEnd) {
      filterOptions['$isla.x$'] = {
        [sequelize.Op.between]: [xRangeStart, xRangeEnd],
      };
    }

    if (yRangeStart && yRangeEnd) {
      filterOptions['$isla.y$'] = {
        [sequelize.Op.between]: [yRangeStart, yRangeEnd],
      };
    }

    if (townName) {
      filterOptions.nombre = townName;
    }
    let maxUpdateCiudades = await City.max('update',{where:{server:servidor}});
    let maxUpdatePuntos = await Puntos.max('update')
    filterOptions.update= maxUpdateCiudades;
    filterOptions.server=servidor;

    const filteredCities = await City.findAll({
      include: [
        {
          model: Player,
          as: 'player',
          required:true,
          where:{server:servidor},
          include: [
            {
              model: Alianza,
              as: 'alianza',
              where:{server:servidor},
            },
            {
              model: Puntos,
              as: 'puntos',
              where: { update: maxUpdatePuntos }
            },
          ],
        },
        {
          model: Isla,
          as: 'isla',
          where:{server:servidor},
        },
      ],
      where:
        filterOptions,
    });

    res.json(filteredCities);
  } catch (error) {
    console.error('Error filtering cities:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/filter-cities-inactives', async (req, res) => {
  try {
    const servidor = req.query.server;
    const allianceName = req.query.allianceName;
    const xRangeStart = req.query.xRangeStart;
    const xRangeEnd = req.query.xRangeEnd;
    const yRangeStart = req.query.yRangeStart;
    const yRangeEnd = req.query.yRangeEnd;
    const townName = req.query.townName;

    const filterOptions = {};

    if (allianceName) {
      filterOptions['$player.alianza.nombre$'] = allianceName;
    }

    if (xRangeStart && xRangeEnd) {
      filterOptions['$isla.x$'] = {
        [sequelize.Op.between]: [xRangeStart, xRangeEnd],
      };
    }

    if (yRangeStart && yRangeEnd) {
      filterOptions['$isla.y$'] = {
        [sequelize.Op.between]: [yRangeStart, yRangeEnd],
      };
    }

    if (townName) {
      filterOptions.nombre = townName;
    }
    filterOptions['$player.estado$'] = "inactive";
    let maxUpdate = await Updates.max('numero',{where:{server:servidor}});
    filterOptions.update= maxUpdate;

    const filteredCities = await City.findAll({
      include: [
        {
          model: Player,
          as: 'player',
          where:{server:servidor},
          required:true,
          include: [
            {
              model: Alianza,
              as: 'alianza',
              where:{server:servidor},
            },
            {
              model: Puntos,
              as: 'puntos',
              where: { update: maxUpdate }
            },
          ],
        },
        {
          model: Isla,
          as: 'isla',
          where:{server:servidor},
        },
      ],
      where: filterOptions
    });

    console.log(filteredCities[0]);
    res.json(filteredCities);
  } catch (error) {
    console.error('Error filtering cities:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Isla Endpoints
router.get('/islas', (req, res) => {
  Isla.findAll().then((islas) => {
    res.json(islas);
  });
});

router.post('/islas', (req, res) => {
  Isla.create(req.body).then((newIsla) => {
    res.json(newIsla);
  });
});

router.get('/islas/:id', (req, res) => {
  Isla.findByPk(req.params.id).then((isla) => {
    if (!isla) {
      res.status(404).json({ error: 'Isla not found' });
    } else {
      res.json(isla);
    }
  });
});

router.get('/filter-islands', async (req, res) => {
  try {
    const servidor = req.query.server;
const goodlvStart=req.query.goodlvStart;
const goodlvEnd=req.query.goodlvEnd;
const woodlvStart=req.query.woodlvStart;
const woodlvEnd=req.query.woodlvEnd;
const selectedGood = req.query.specificGood;
const xStart = req.query.xRangeStart;
const xEnd = req.query.xRangeEnd;
const yStart = req.query.yRangeStart;
const yEnd = req.query.yRangeEnd;
    

    const filterOptions = {};

    if (goodlvStart && goodlvEnd) {
      filterOptions.goodlv = {
        [sequelize.Op.between]: [goodlvStart, goodlvEnd]
      };
    }else if(goodlvStart){
      filterOptions.goodlv ={
        [sequelize.Op.gte]:goodlvStart
      };
    }else if(goodlvEnd){
      filterOptions.goodlv ={
        [sequelize.Op.lte]:goodlvEnd
      };
    }
    

    if (woodlvStart && woodlvEnd) {
      filterOptions.woodlv = {
        [sequelize.Op.between]: [woodlvStart, woodlvEnd]
      };
    }else if(woodlvStart){
      filterOptions.woodlv ={
        [sequelize.Op.gte]:woodlvStart
      };
    }else if(woodlvEnd){
      filterOptions.woodlv ={
        [sequelize.Op.lte]:woodlvEnd
      };
    }

    if (selectedGood) {
      filterOptions.good = selectedGood;
    }

    if (xStart && xEnd) {
      filterOptions.x = {
        [sequelize.Op.between]: [xStart, xEnd]
      };
    }else if(xStart){
      filterOptions.x ={
        [sequelize.Op.gte]:xStart
      };
    }else if(xEnd){
      filterOptions.x ={
        [sequelize.Op.lte]:xEnd
      };
    }

    if (yStart && yEnd) {
      filterOptions.y = {
        [sequelize.Op.between]: [yStart, yEnd]
      };
    }else if(yStart){
      filterOptions.y ={
        [sequelize.Op.gte]:yStart
      };
    }else if(yEnd){
      filterOptions.y ={
        [sequelize.Op.lte]:yEnd
      };
    }
    filterOptions.server=servidor;
    // Fetch islands based on the filter options
    const filteredIslands = await Isla.findAll({
      where: filterOptions
    });

    // Return the filtered islands
    res.json(filteredIslands);
  } catch (error) {
    console.error('Error filtering islands:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function getIslaInfo(idIsla, servidor){
  let maxUpdateCiudades = await City.max('update',{where:{server:servidor}});
  let maxUpdatePuntos = await Puntos.max('update')
  return Isla.findOne({
    where:{
      server:servidor,
      idisla:idIsla
    },
    include:[
      {
        model:City,
        as:'cities',
        where: { update : maxUpdateCiudades },
        include:{
          model:Player,
          as: 'player',
          where:{server:servidor},
          include:[
            {
              model:Alianza,
              as:'alianza',
              where:{server:servidor},
              required:false
            },
            {
              model: Puntos,
              as: 'puntos',
              where: { update : maxUpdatePuntos },
            },
          ]
        }
      }
    ],
  })
}

// Player Endpoints
router.get('/players', (req, res) => {
  Player.findAll().then((players) => {
    res.json(players);
  });
});

router.post('/players', (req, res) => {
  Player.create(req.body).then((newPlayer) => {
    res.json(newPlayer);
  });
});

router.get('/players/masCiudades', (req,res)=>{
  let maxUpdatePuntos;
  Puntos.max('update').then(re=>{
    maxUpdatePuntos = re;
    let maxUpdateCiudades;
    City.max('update',{where:{server:req.query.servidor}}).then(r=>{
      maxUpdateCiudades=r;
      Player.findAll({
        include: [
          // Incluye la alianza asociada al jugador
          { model: Alianza, as: 'alianza', required:false, where:{server:req.query.servidor} },
          // Incluye los puntos asociados al jugador
          { model: Puntos, as: 'puntos', where:{update:maxUpdatePuntos} },
          // Incluye las ciudades asociadas al jugador y cuenta la cantidad de ciudades
          {
            model: City,
            as: 'cities',
            attributes: [[sequelize.fn('COUNT', sequelize.col('idcity')), 'cityCount']],
            where:{update:maxUpdateCiudades}
          },
        ],
        where:{server:req.query.servidor},
        // Agrupa por el ID del jugador para evitar duplicados
        group: ['player.idplayer']
      })
      .then(players => {
        players.sort((a, b) => b.dataValues.cities[0].dataValues.cityCount - a.dataValues.cities[0].dataValues.cityCount);

        res.send(players.slice((+req.query.pagina), (50+50*req.query.pagina)))
      })
    });


  })

  
})

router.get('/players/:id', (req, res) => {
  Player.findByPk(req.params.id).then((player) => {
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
    } else {
      res.json(player);
    }
  });
});


async function getPlayerInfo(idPlayer, servidor){
  let maxUpdateCiudades = await City.max('update',{where:{server:servidor}});
  return Player.findByPk(idPlayer,{
    include:[
      {
        model:Alianza,
        as:'alianza',
        where:{server:servidor},
        required:false
      },
      {
        model: Puntos,
        as: 'puntos',
        order:[['update','DESC']]
      },
      {
        model:City,
        as:'cities',
        where: { update : maxUpdateCiudades },
        include:{
          model:Isla,
          as: 'isla',
          where:{server:servidor}
        }
      }
    ]
  })
}


router.get('/filter-players', async (req, res) => {
  try {
    const servidor = req.query.server;
    const playerName = req.query.playerName;
    const allianceName = req.query.allianceName;
    const minPoints = req.query.minPoints;
    const maxPoints = req.query.maxPoints;

    const filterOptions = {};

    if (playerName) {
      filterOptions['$player.nombre$'] = playerName;
    }

    if (allianceName) {
      filterOptions['$alianza.nombre$'] = allianceName;
    }

    if (minPoints || maxPoints) {
      const totalPointsFilter = {};

      if (minPoints) {
        totalPointsFilter[sequelize.Op.gte] = minPoints;
      }

      if (maxPoints) {
        totalPointsFilter[sequelize.Op.lte] = maxPoints;
      }

      filterOptions['$puntos.Constructor$'] = totalPointsFilter;
    }

    let maxUpdatePuntos = await Puntos.max('update');
    filterOptions.server=servidor;

    const filteredPlayers = await Player.findAll({
      include: [{
        model: Alianza,
        as: 'alianza',
        where:{server:servidor},
      }, {
        model: Puntos,
        as: 'puntos',
        where: { update: maxUpdatePuntos }
      }],
      where: filterOptions
    });

    res.json(filteredPlayers);
  } catch (error) {
    console.error('Error filtering players:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Puntos Endpoints
router.get('/puntos', (req, res) => {
  Puntos.findAll().then((puntos) => {
    res.json(puntos);
  });
});

router.post('/puntos', (req, res) => {
  Puntos.create(req.body).then((newPuntos) => {
    res.json(newPuntos);
  });
});

router.get('/puntos/players', (req, res) => {
  let maxUpdatePuntos;
  Puntos.max('update').then(r=>{
    maxUpdatePuntos=r;

    Puntos.findAll({
      include:{
        model:Player,
        as: 'player',
        where: {server:req.query.servidor},
        include:{
          model:Alianza,
          as: 'alianza',
          where: {server: req.query.servidor},
          required:false
        }
      },
      where: {update:maxUpdatePuntos},
      order: [[req.query.clasificacion, 'DESC']],
      limit: 50,
      offset:+req.query.pagina
    }).then(puntos => res.send(puntos))

  });

})

router.get('/puntos/alianzas', (req, res) => {
  let maxUpdatePuntos;
  Puntos.max('update').then(r=>{
    maxUpdatePuntos=r;

    Puntos.findAll({
      include:{
        model:Player,
        as: 'player',
        where: {server:req.query.servidor},
        attributes:{},
        include:{
          model:Alianza,
          as: 'alianza',
          where: {server: req.query.servidor},
          required:true
        }
      },
      attributes:
        [[sequelize.fn('sum', sequelize.col(req.query.clasificacion)), 'puntos']],
      where: {update:maxUpdatePuntos},
      order: [[sequelize.fn('sum', sequelize.col(req.query.clasificacion)), 'DESC']],
      limit: 50,
      offset:+req.query.pagina,
      group:'player.idAlianza'
    }).then(puntos => res.send(puntos))

  });

})


router.get('/puntos/:id', (req, res) => {
  Puntos.findByPk(req.params.id).then((punto) => {
    if (!punto) {
      res.status(404).json({ error: 'Puntos not found' });
    } else {
      res.json(punto);
    }
  });
});







// Updates Endpoints
router.get('/updates', (req, res) => {
  Updates.findAll().then((updates) => {
    res.json(updates);
  });
});

router.post('/updates', (req, res) => {
  Updates.create(req.body).then((newUpdates) => {
    res.json(newUpdates);
  });
});

router.get('/updates/:id', (req, res) => {
  Updates.findByPk(req.params.id).then((update) => {
    if (!update) {
      res.status(404).json({ error: 'Updates not found' });
    } else {
      res.json(update);
    }
  });
});

router.get('/fetch-dates', async (req, res) => {
  const servidor = req.query.server;
  try {
    // Fetch dates from your Update table
    const dates = await Updates.findAll({
        attributes: ['numero', 'fecha', 'server'],
        where:{server:servidor}
    });

    // Format dates to DD-MM-YYYY
    const formattedDates = dates.map(date => ({
        numero: date.numero,
        fecha: new Date(date.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }));

    res.json(formattedDates);
} catch (error) {
    console.error('Error fetching dates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

//puntos

router.get('/point-increase-ranking', async (req, res) => {
 try {
  const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const servidor = req.query.server;
      const clasificacion = req.query.clasificacion;
      const pagina = req.query.pagina;
      const order = req.query.order ? req.query.order : 0;
      const filtros={
        startDate:startDate,
        endDate:endDate,
        servidor:servidor,
        pagina:pagina,
        clasificacion:clasificacion,
        order:order
      }
      console.log(filtros)
      const result = await Player.tops(filtros);
  res.json(result);
  
  } catch (error) {
      console.error('Error calculating point increase ranking:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/point-increase-ranking-alliances', async (req, res) => {
  try {
   const startDate = req.query.startDate;
       const endDate = req.query.endDate;
       const servidor = req.query.server;
       const clasificacion = req.query.clasificacion;
       const pagina = req.query.pagina;
       const order = req.query.order ? req.query.order : 0;
       const filtros={
         startDate:startDate,
         endDate:endDate,
         servidor:servidor,
         pagina:pagina,
         clasificacion:clasificacion,
         order:order
       }
       console.log(filtros)
       const result = await Alianza.tops(filtros);
   res.json(result);
   
   } catch (error) {
       console.error('Error calculating point increase ranking:', error);
       res.status(500).json({ error: 'Internal Server Error' });
   }
 });
 


module.exports = {router, getPlayerInfo, getAlianzaInfo, getIslaInfo};