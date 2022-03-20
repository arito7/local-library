const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const async = require('async');
const { nextTick } = require('async');
const { body, validationResult } = require('express-validator');
exports.index = function (req, res) {
  async.parallel(
    {
      book_count: (cb) => {
        Book.countDocuments({}, cb);
      },
      book_instance_count: (cb) => {
        BookInstance.countDocuments({}, cb);
      },
      book_instance_available_count: (cb) => {
        BookInstance.countDocuments({ status: 'Available' }, cb);
      },
      author_count: (cb) => {
        Author.countDocuments({}, cb);
      },
      genre_count: (cb) => {
        Genre.countDocuments({}, cb);
      },
    },
    function (err, results) {
      res.render('index', {
        title: 'Local Library Home',
        error: err,
        data: results,
      });
    }
  );
};

// Display list of all books.
exports.book_list = function (req, res, next) {
  Book.find({}, 'title author')
    .sort({ title: 1 })
    .populate('author')
    .exec((err, list_books) => {
      if (err) {
        return next(err);
      }
      res.render('book-list', { title: 'Book List', book_list: list_books });
    });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
  async.parallel(
    {
      book: function (cb) {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(cb);
      },
      book_instance: function (cb) {
        BookInstance.find({ book: req.params.id }).exec(cb);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        let err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }
      res.render('book-detail', {
        title: results.book.title,
        book: results.book,
        book_instances: results.book_instance,
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
  async.parallel(
    {
      authors: function (cb) {
        Author.find(cb);
      },
      genres: function (cb) {
        Genre.find(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('book-form', {
        title: 'Create Book',
        authors: results.authors,
        genres: results.genres,
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),
  (req, res, next) => {
    // extract the validation errors from a request.
    const errors = validationResult(req);

    // create a book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      // there are errors. render form again with sanitized values/error msgs
      // get all authors and genres for form
      async.parallel(
        {
          authors: function (cb) {
            Author.find(cb);
          },
          genres: function (cb) {
            Genre.find(cb);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          // mark our selected genres as checked.
          for (let i = 0; i < results.genres.length; i += 1) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = true;
            }
          }

          res.render('book-form', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genres,
            book,
            errors: errors.array(),
          });
        }
      );
    } else {
      // data from form is valid. save book
      book.save((err) => {
        if (err) {
          return next(err);
        }
        res.redirect(book.url);
      });
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {};

// Handle book delete on POST.
exports.book_delete_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Book update GET');
};

// Handle book update on POST.
exports.book_update_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Book update POST');
};
