const { DataTypes, Sequelize } = require('sequelize');

const { QueryTypes } = require('sequelize');

const sequelize = new Sequelize(
    'ikariam3',
    'matias',
    '1234',
     {
       host: 'localhost',
       dialect: 'mysql',
       define:{
        timestamps:false
       },
       logging:true
     }
   );
   
   sequelize.authenticate().then(() => {
       console.log('Connection has been established successfully.');
    }).catch((error) => {
       console.error('Unable to connect to the database: ', error);
    });

const db = sequelize;
const Alianza = sequelize.define('alianza', {
  idalianza: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  server: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },

});



const City = sequelize.define('city', {
    idcity: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    nivel: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    playerid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    islaid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    update: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    server: {
      type: DataTypes.STRING(45),
      primaryKey: true,
    },
  });
  
  // Associations
  
  


  const Isla = sequelize.define('isla', {
    idisla: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    x: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    y: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    good: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    woodlv: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    goodlv: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    wonder: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    wonderName: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    wonderlv: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    server: {
      type: DataTypes.STRING(45),
      primaryKey: true,
    },
  });
  


  const Player = sequelize.define('player', {
    idplayer: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    idAlianza: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    server: {
      type: DataTypes.STRING(45),
      primaryKey: true,
    },
  });
  
  // Associations

  


  const Puntos = sequelize.define('puntos', {
    idPlayer: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    update: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    Totales: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Constructor: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    NivelConstruccion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Investigadores: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    NivelInvestigadores: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Generales: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Oro: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    Donacion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  });
  
  // Associations

  
  const Updates = sequelize.define('updates', {
    idupdates: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    server: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
  });


// City - Isla association
City.belongsTo(Isla, { foreignKey: 'islaid', as: 'isla' });
Isla.hasMany(City, { foreignKey: 'islaid', as: 'cities' });

// Player - City association
Player.hasMany(City, { foreignKey: 'playerid', as: 'cities' });
City.belongsTo(Player, { foreignKey: 'playerid', as: 'player' });

// Player - Alianza association
Player.belongsTo(Alianza, {foreignKey:'idAlianza', as: 'alianza'});
Alianza.hasMany(Player, {foreignKey:'idAlianza', as: 'players'});

// Player - Puntos association
Player.hasMany(Puntos, { foreignKey: 'idPlayer', as: 'puntos' });
Puntos.belongsTo(Player, { foreignKey: 'idPlayer', as: 'player' });

Updates.hasMany(City, { foreignKey: 'update', as: 'updateNumberCity' });
City.belongsTo(Updates, { foreignKey: 'update', as: 'updateNumberCity' });

Updates.hasMany(Puntos, { foreignKey: 'update', as: 'updateNumberPuntos' });
Puntos.hasMany(Updates, { foreignKey: 'numero', as: 'updateNumberPuntos' });


Player.tops=({startDate, endDate, servidor, pagina, clasificacion, order})=> {
 return tops({startDate, endDate, servidor, pagina, clasificacion, order});
}

async function tops ({startDate, endDate, servidor, pagina, clasificacion, order=0}){
  //order 0 es para crecimiento, order 1 para decrecimiento
  let query="SELECT alianzas.idalianza, players.idplayer, alianzas.nombre as 'alianza', players.nombre, DATE_FORMAT(ub.fecha, '%d/%m/%y') as 'fecha',"+
  " b."+clasificacion+" as 'bPuntos',"+
  " a."+clasificacion+" as 'aPuntos',"+
  " ub.numero, ua.numero as 'aNumero' "+
  " FROM players "+
  " LEFT JOIN puntos a ON players.idplayer = a.idPlayer "+
  " LEFT JOIN puntos b ON players.idplayer = b.idPlayer "+
  " JOIN updates ua ON ua.numero = a.update "+
  " JOIN updates ub ON ub.numero = b.update "+
  " LEFT JOIN alianzas ON players.idAlianza = alianzas.idalianza AND alianzas.server = '"+servidor+"'  "+
  " WHERE ub.numero = "+endDate+""+
  " AND ua.numero = (SELECT MIN(p2.update) FROM puntos p2 WHERE p2.idplayer = players.idplayer AND p2.update >= "+startDate+") "+
  " AND players.server = '"+servidor+"' "+
  " AND ua.server = '"+servidor+"' "+
  " AND ub.server = '"+servidor+"' "
  if(order==0)
    query = query + " order by b."+clasificacion+"-a."+clasificacion+" desc"
  else
  query = query + " order by a."+clasificacion+"-b."+clasificacion+" desc"
  
  query = query + " limit "+(+pagina*50)+", 50;";
  console.log(query)
  const result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });
    return result;

}

Alianza.tops=({startDate, endDate, servidor, pagina, clasificacion, order})=> {
  return topsAlianzas({startDate, endDate, servidor, pagina, clasificacion, order});
 }

async function topsAlianzas ({startDate, endDate, servidor, pagina, clasificacion, order=0}){
  //order 0 es para crecimiento, order 1 para decrecimiento
  let query="SELECT alianzas.idalianza, alianzas.nombre as 'nombre', DATE_FORMAT(ub.fecha, '%d/%m/%y') as 'fecha',"+
  " sum(b."+clasificacion+") as 'bPuntos',"+
  " sum(a."+clasificacion+") as 'aPuntos',"+
  " ub.numero, ua.numero as 'aNumero' "+
  " FROM players "+
  " LEFT JOIN puntos a ON players.idplayer = a.idPlayer "+
  " LEFT JOIN puntos b ON players.idplayer = b.idPlayer "+
  " JOIN updates ua ON ua.numero = a.update "+
  " JOIN updates ub ON ub.numero = b.update "+
  " JOIN alianzas ON players.idAlianza = alianzas.idalianza AND alianzas.server = '"+servidor+"'  "+
  " WHERE ub.numero = "+endDate+""+
  " AND ua.numero = (SELECT MIN(p2.update) FROM puntos p2 WHERE p2.idplayer = players.idplayer AND p2.update >= "+startDate+") "+
  " AND players.server = '"+servidor+"' "+
  " AND ua.server = '"+servidor+"' "+
  " AND ub.server = '"+servidor+"' "+
  " group by idalianza "
  if(order==0)
    query = query + " order by sum(b."+clasificacion+")-sum(a."+clasificacion+") desc"
  else
  query = query + " order by sum(a."+clasificacion+")-sum(b."+clasificacion+") desc"

  query = query + " limit "+(+pagina*50)+", 50;";
  console.log(query)
  const result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });
    return result;

}


module.exports = {
  Alianza,
  City,
  Isla,
  Player,
  Puntos,
  Updates,
  db
};