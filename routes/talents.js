var express = require('express');
var router = express.Router();
var pg = require('pg');
var connectionString = process.env.DATABASE_URL ||
'postgres://localhost:5432/talent_db';

/**
* Creates a new talent, and returns all talents
*/
router.post('/', function(req, res) {
  var result = {};

  // Grab data from http request
  var data = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    phone: req.body.phone,
    low: req.body.low,
    high: req.body.high,
    skills: req.body.skills
  };

  // Get a Postgres client from the connection pool
  pg.connect(connectionString, function(err, client, done) {
    // Handle Errors
    if(err) {
      console.log(err);
    }

    // SQL Query Insert data, then select data
    var first =  client.query('INSERT INTO talent' +
    '(first_name, last_name, phone, low_range, high_range) ' +
    'values($1, $2, $3, $4, $5) RETURNING *;',
    [data.firstname, data.lastname, data.phone, data.low, data.high], function(err, result) {
      // Handle Errors
      if(err) {
        console.log(err);
      }
      done();

      talent = result.rows[0];

      if (data.skills.length > 0){
        talent.skills = [];

        var lastQuery;

        // go add the skills!
        data.skills.forEach(function(elem){
          lastQuery = client.query('INSERT INTO talent_skills(talent_id, skills_id) ' +
          'values($1, $2);', [talent.talent_id, elem]);
        });

        // close connection and return results
        lastQuery.on('end', function() {
          client.end();
          return res.json(talent);
        });
      } else {
        return res.json(talent);
      }
    });
  });
});

/**
* Gets all talent
*/
router.get('/', function(req, res) {
  var results = [];

  // Get a Postgres client from the connection pool
  pg.connect(connectionString, function(err, client, done) {

    // Handle Errors
    if(err) {
      console.log(err);
    }
    // SQL Query > Select Data
    var query = client.query('SELECT * FROM talent ORDER BY talent_id ASC;');

    // Stream results back one row at a time
    query.on('row', function(row) {
      results.push(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function() {
      client.end();
      return res.json(results);
    });

  });

});

/**
* Updates a talent
*/
router.put('/:talentId', function(req, res) {

  var results = [];

  // Grab data from the URL parameters
  var id = req.params.talentId;

  // Grab data from http request
  var data = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    phone: req.body.phone,
    low: req.body.low,
    high: req.body.high,
    skills: req.body.skills
  };

  // Get a Postgres client from the connection pool
  pg.connect(connectionString, function(err, client, done) {

    // Handle Errors
    if(err) {
      console.log(err);
    }

    // SQL Query > Update Data
    client.query('UPDATE talent SET ' +
    'first_name=($1) last_name=($2) phone=($3) low_range=($4) high_range=($5) ' +
    'WHERE talent_id=($6);',
    [data.firstname, data.lastname, data.phone, data.low, data.high, id]);

    // SQL Query > Select Data
    var query = client.query('SELECT * FROM talent ORDER BY talent_id ASC');

    // Stream results back one row at a time
    query.on('row', function(row) {
      results.push(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function() {
      client.end();
      return res.json(results);
    });
  });

});

/**
* Deletes a talent
*/
router.delete('/:talentId', function(req, res) {

  var results = [];

  // Grab data from the URL parameters
  var id = req.params.talentId;

  // Get a Postgres client from the connection pool
  pg.connect(connectionString, function(err, client, done) {

    // Handle Errors
    if(err) {
      console.log(err);
    }

    // SQL Query > Delete Data
    client.query('DELETE FROM talent_skills WHERE talent_id=($1)', [id]);
    client.query('DELETE FROM talent WHERE talent_id=($1)', [id]);

    // SQL Query > Select Data
    var query = client.query('SELECT * FROM talent ORDER BY talent_id ASC');

    // Stream results back one row at a time
    query.on('row', function(row) {
      results.push(row);
    });

    // After all data is returned, close connection and return results
    query.on('end', function() {
      client.end();
      return res.json(results);
    });
  });

});

module.exports = router;
