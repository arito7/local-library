const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');

const bookInstanceValidationSchema = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
];

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      res.render('bookinstance-list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance-detail', {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, 'title').exec((err, books) => {
    if (err) {
      return next(err);
    }
    res.render('bookinstance-form', {
      title: 'Create BookInstance',
      book_list: books,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  bookInstanceValidationSchema,
  (req, res, next) => {
    // extract the validation errors from a request
    const errors = validationResult(req);

    // create a bookinstance object with escaped and trimmed data
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    // if there ARE errors
    if (!errors.isEmpty()) {
      Book.find({}, 'title').exec((err, books) => {
        if (err) {
          return next(err);
        }
        res.render('bookinstance-form', {
          title: 'Create BookInstance',
          book_list: books,
          selected_book: bookinstance.book._id,
          error: errors.array(),
          bookinstance,
        });
      });
      return;
    } else {
      bookinstance.save((err) => {
        if (err) {
          return next(err);
        }
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      res.render('bookinstance-delete', {
        title: 'Delete Book Instance',
        bookinstance,
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndDelete(req.params.id).exec((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/catalog/bookinstances');
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  async.parallel(
    {
      bookinstance: function (cb) {
        BookInstance.findById(req.params.id).exec(cb);
      },
      book_list: function (cb) {
        Book.find(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('bookinstance-form', {
        title: 'Update Book Instance',
        bookinstance: results.bookinstance,
        book_list: results.book_list,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  bookInstanceValidationSchema,
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      async.parallel(
        {
          bookinstance: function (cb) {
            BookInstance.findById(req.params.id).exec(cb);
          },
          book_list: function (cb) {
            Book.find(cb);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }
          res.render('bookinstance-form', {
            title: 'Update BookInstance',
            bookinstance: results.bookinstance,
            book_list: results.book_list,
          });
        }
      );
    } else {
      const bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id,
      });

      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        (err, thebookinstance) => {
          if (err) {
            return next(err);
          }
          res.redirect(thebookinstance.url);
        }
      );
    }
  },
];
