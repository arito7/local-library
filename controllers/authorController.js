const Author = require('../models/author');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');

// display list of all authors
exports.author_list = function (req, res, next) {
  Author.find()
    .sort({ family_name: 1 })
    .exec((err, list_authors) => {
      if (err) {
        return next(err);
      }
      res.render('author-list', {
        title: 'Author List',
        author_list: list_authors,
      });
    });
};

// display detail page for a specific author
exports.author_detail = function (req, res, next) {
  async.parallel(
    {
      author: function (cb) {
        Author.findById(req.params.id).exec(cb);
      },
      author_books: function (cb) {
        Book.find({ author: req.params.id }, 'title summary').exec(cb);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render('author-detail', {
        title: 'Author Detail',
        author: results.author,
        author_books: results.author_books,
      });
    }
  );
};

// Display Author create form on GET.
exports.author_create_get = function (req, res, next) {
  res.render('author-form', { title: 'Create Author' });
};

// Handle Author create on POST.
exports.author_create_post = [
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    // extract the validation errors from a request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // there are errors. render form again with sanitized values/errors msgs.
      res.render('author-form', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array(),
      });
      return;
    } else {
      // data from form is valid
      // create an author object with escaped and trimmed data
      let author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });
      author.save((err) => {
        if (err) {
          return next(err);
        }
        // if save successful redirect to new author record
        res.redirect(author.url);
      });
    }
  },
];

// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {
  async.parallel(
    {
      author: function (cb) {
        Author.findById(req.params.id).exec(cb);
      },
      author_books: function (cb) {
        Book.find({ author: req.params.id }).exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        res.redirect('catalog/authors');
      }
      res.render('author-delete', {
        title: 'Delete Author',
        author: results.author,
        author_books: results.author_books,
      });
    }
  );
};

// Handle Author delete on POST.
exports.author_delete_post = (req, res, next) => {
  async.parallel(
    {
      author: function (cb) {
        Author.findById(req.body.authorid).exec(cb);
      },
      authors_books: function (cb) {
        Book.find({ author: req.body.authorid }).exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.authors_books.length > 0) {
        res.render('author-delete', {
          title: 'Delete Author',
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      } else {
        // author has no books. Delete object and redirect to list
        // of authors
        Author.findByIdAndDelete(req.body.authorid, (err) => {
          if (err) {
            return next(err);
          }
          // successful delete
          res.redirect('/catalog/authors');
        });
      }
    }
  );
};

// Display Author update form on GET.
exports.author_update_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Author update POST');
};
