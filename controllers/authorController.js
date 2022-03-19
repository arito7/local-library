const Author = require('../models/author');
const Book = require('../models/book');
const async = require('async');

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
exports.author_create_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Author create GET');
};

// Handle Author create on POST.
exports.author_create_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Author create POST');
};

// Display Author delete form on GET.
exports.author_delete_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Author delete GET');
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Author delete POST');
};

// Display Author update form on GET.
exports.author_update_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Author update POST');
};
