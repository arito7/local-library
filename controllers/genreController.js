const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');

const genreValidationSchema = [
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
];
// Display list of all Genre.
exports.genre_list = function (req, res, next) {
  Genre.find()
    .sort({ name: 1 })
    .exec((err, genre_list) => {
      if (err) {
        return next(err);
      }
      res.render('genre-list', { title: 'Genre List', genre_list });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  async.parallel(
    {
      genre: function (cb) {
        Genre.findById(req.params.id).exec(cb);
      },
      genre_books: function (cb) {
        Book.find({ genre: req.params.id }).exec(cb);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        let err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      res.render('genre-detail', {
        title: 'Genre Detail',
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
  res.render('genre-form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  genreValidationSchema,
  (req, res, next) => {
    // extract the validation errors from the req
    const errors = validationResult(req);

    // create a genre object with escaped and trimmed data
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // there are errors. render the form again with sanitized values/error messages
      res.render('genre-form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // data from form is valid
      // check if genre with same name already exists
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // genre exists, redirect to its detail page
          res.redirect(found_genre.url);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  async.parallel(
    {
      genre: function (cb) {
        Genre.findById(req.params.id).exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('genre-delete', {
        title: 'Delete Genre',
        genre: results.genre,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
  Genre.findByIdAndDelete(req.body.id).exec((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/catalog/genres');
  });
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  async.parallel(
    {
      genre: function (cb) {
        Genre.findById(req.params.id).exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('genre-update', {
        title: 'Update Genre',
        genre: results.genre,
      });
    }
  );
};

// Handle Genre update on POST.
exports.genre_update_post = [
  genreValidationSchema,
  (req, res, next) => {
    // extract the validation errors from the req
    const errors = validationResult(req);

    // create a genre object with escaped and trimmed data
    const genre = new Genre({ name: req.body.name, _id: req.params.id });

    if (!errors.isEmpty()) {
      // there are errors. render the form again with sanitized values/error messages
      res.render('genre-form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
        if (err) {
          return next(err);
        }
        res.redirect(thegenre.url);
      });
    }
  },
];
