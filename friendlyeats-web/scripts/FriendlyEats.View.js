
'use strict';

FriendlyEats.prototype.initTemplates = function () {
  console.log('initTemplates');
  this.templates = {};

  var that = this;
  document.querySelectorAll('.template').forEach(function (el) {
    that.templates[el.getAttribute('id')] = el;
  });
};

FriendlyEats.prototype.viewHome = function () {
  console.log('viewHome');
  this.getAllRestaurants();
};

FriendlyEats.prototype.viewList = function (filters, filter_description) {
  console.log('viewList');
  if (!filter_description) {
    filter_description = 'any type of food with any price in any city.';
  }

  var mainEl = this.renderTemplate('main-adjusted');
  var headerEl = this.renderTemplate('header-base', {
    hasSectionHeader: true,
  });

  this.replaceElement(
    headerEl.querySelector('#section-header'),
    this.renderTemplate('filter-display', {
      filter_description: filter_description,
    })
  );

  this.replaceElement(document.querySelector('.header'), headerEl);
  this.replaceElement(document.querySelector('main'), mainEl);

  var that = this;
  headerEl.querySelector('#show-filters').addEventListener('click', function () {
    that.dialogs.filter.show();
  });

  var renderer = {
    remove: function (doc) {
      var locationCardToDelete = mainEl.querySelector('#doc-' + doc.id);
      if (locationCardToDelete) {
        mainEl.querySelector('#cards').removeChild(locationCardToDelete.parentNode);
      }

      return;
    },

    display: function (doc) {
      var data = doc.data();
      data['.id'] = doc.id;
      data['go_to_restaurant'] = function () {
        that.router.navigate('/restaurants/' + doc.id);
      };

      var el = that.renderTemplate('restaurant-card', data);
      el.querySelector('.rating').append(that.renderRating(data.avgRating));
      el.querySelector('.price').append(that.renderPrice(data.price));
      // Setting the id allows to locating the individual restaurant card
      el.querySelector('.location-card').id = 'doc-' + doc.id;

      var existingLocationCard = mainEl.querySelector('#doc-' + doc.id);
      if (existingLocationCard) {
        // modify
        existingLocationCard.parentNode.before(el);
        mainEl.querySelector('#cards').removeChild(existingLocationCard.parentNode);
      } else {
        // add
        mainEl.querySelector('#cards').append(el);
      }
    },

    empty: function () {
      var headerEl = that.renderTemplate('header-base', {
        hasSectionHeader: true,
      });

      var noResultsEl = that.renderTemplate('no-results');

      that.replaceElement(
        headerEl.querySelector('#section-header'),
        that.renderTemplate('filter-display', {
          filter_description: filter_description,
        })
      );

      headerEl.querySelector('#show-filters').addEventListener('click', function () {
        that.dialogs.filter.show();
      });

      that.replaceElement(document.querySelector('.header'), headerEl);
      that.replaceElement(document.querySelector('main'), noResultsEl);
      return;
    },
  };

  if (filters.city || filters.category || filters.price || filters.sort !== 'Rating') {
    this.getFilteredRestaurants({
      city: filters.city || 'Any',
      category: filters.category || 'Any',
      price: filters.price || 'Any',
      sort: filters.sort,
    }, renderer);
  } else {
    this.getAllRestaurants(renderer);
  }

  var toolbar = mdc.toolbar.MDCToolbar.attachTo(document.querySelector('.mdc-toolbar'));
  toolbar.fixedAdjustElement = document.querySelector('.mdc-toolbar-fixed-adjust');

  mdc.autoInit();
};

FriendlyEats.prototype.viewSetup = function () {

    console.log('viewSetup');
    var headerEl = this.renderTemplate('header-base', {
      hasSectionHeader: false,
    });

    var config = this.getFirebaseConfig();
    var noRestaurantsEl = this.renderTemplate('no-restaurants', config);

    var button = noRestaurantsEl.querySelector('#add_mock_data');
    var addingMockData = false;

    var that = this;
    button.addEventListener('click', function (event) {
      if (addingMockData) {
        return;
      }

      addingMockData = true;

      event.target.style.opacity = '0.4';
      event.target.innerText = 'Please wait...';

      that.addMockRestaurants().then(function () {
        that.rerender();
      });
    });

    this.replaceElement(document.querySelector('.header'), headerEl);
    this.replaceElement(document.querySelector('main'), noRestaurantsEl);

    firebase
      .firestore()
      .collection('restaurants')
      .limit(1)
      .onSnapshot(function (snapshot) {
        if (snapshot.size && !addingMockData) {
          that.router.navigate('/');
        }
      });
  };

FriendlyEats.prototype.initReviewDialog = function () {
  console.log('initReviewDialog');
  var dialog = document.querySelector('#dialog-add-review');
  this.dialogs.add_review = new mdc.dialog.MDCDialog(dialog);

  var that = this;
  this.dialogs.add_review.listen('MDCDialog:accept', function () {
    var pathname = that.getCleanPath(document.location.pathname);
    var id = pathname.split('/')[2];

    that.addRating(id, {
      rating: rating,
      text: dialog.querySelector('#text').value,
      userName: 'Anonymous (Web)',
      timestamp: new Date(),
      userId: firebase.auth().currentUser.uid,
    }).then(function () {
      that.rerender();
    });
  });

  var rating = 0;

  dialog.querySelectorAll('.star-input i').forEach(function (el) {
    var rate = function () {
      var after = false;
      rating = 0;
      [].slice.call(el.parentNode.children).forEach(function (child) {
        if (!after) {
          rating++;
          child.innerText = 'star';
        } else {
          child.innerText = 'star_border';
        }

        after = after || child.isSameNode(el);
      });
    };

    el.addEventListener('mouseover', rate);
  });
};

FriendlyEats.prototype.initFilterDialog = function () {
  console.log('initFilterDialog');
  // TODO: Reset filter dialog to init state on close.
  this.dialogs.filter = new mdc.dialog.MDCDialog(document.querySelector('#dialog-filter-all'));

  var that = this;
  this.dialogs.filter.listen('MDCDialog:accept', function () {
    that.updateQuery(that.filters);
  });

  var dialog = document.querySelector('aside');
  var pages = dialog.querySelectorAll('.page');

  this.replaceElement(
    dialog.querySelector('#category-list'),
    this.renderTemplate('item-list', { items: ['Any'].concat(this.data.categories) })
  );

  this.replaceElement(
    dialog.querySelector('#city-list'),
    this.renderTemplate('item-list', { items: ['Any'].concat(this.data.cities) })
  );

  var renderAllList = function () {
    that.replaceElement(
      dialog.querySelector('#all-filters-list'),
      that.renderTemplate('all-filters-list', that.filters)
    );

    dialog.querySelectorAll('#page-all .mdc-list-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.id.split('-').slice(1).join('-');
        displaySection(id);
      });
    });
  };

  var displaySection = function (id) {
    if (id === 'page-all') {
      renderAllList();
    }

    pages.forEach(function (sel) {
      if (sel.id === id) {
        sel.style.display = 'block';
      } else {
        sel.style.display = 'none';
      }
    });
  };

  pages.forEach(function (sel) {
    var type = sel.id.split('-')[1];
    if (type === 'all') {
      return;
    }

    sel.querySelectorAll('.mdc-list-item').forEach(function (el) {
      el.addEventListener('click', function () {
        that.filters[type] = el.innerText.trim() === 'Any' ? '' : el.innerText.trim();
        displaySection('page-all');
      });
    });
  });

  displaySection('page-all');
  dialog.querySelectorAll('.back').forEach(function (el) {
    el.addEventListener('click', function () {
      displaySection('page-all');
    });
  });
};

FriendlyEats.prototype.updateQuery = function (filters) {
  console.log('updateQuery');
  var query_description = '';

  if (filters.category !== '') {
    query_description += filters.category + ' places';
  } else {
    query_description += 'any restaurant';
  }

  if (filters.city !== '') {
    query_description += ' in ' + filters.city;
  } else {
    query_description += ' located anywhere';
  }

  if (filters.price !== '') {
    query_description += ' with a price of ' + filters.price;
  } else {
    query_description += ' with any price';
  }

  if (filters.sort === 'Rating') {
    query_description += ' sorted by rating';
  } else if (filters.sort === 'Reviews') {
    query_description += ' sorted by # of reviews';
  }

  this.viewList(filters, query_description);
};

FriendlyEats.prototype.viewRestaurant = function (id) {
    var that = this;
    var add_meal = document.getElementById('add_meal');
    add_meal.addEventListener('onclick', function () {
      console.log('call meals');
      this.meals(id);
    });

    console.log('viewRestaurant');
    var sectionHeaderEl;

    return this.getRestaurant(id)
      .then(function (doc) {
        var data = doc.data();
        var dialog =  that.dialogs.add_review;

        data.show_add_review = function () {
          // Reset the state before showing the dialog
          dialog.root_.querySelector('#text').value = '';
          dialog.root_.querySelectorAll('.star-input i').forEach(function (el) {
            el.innerText = 'star_border';
          });

          dialog.show();
        };

        sectionHeaderEl = that.renderTemplate('restaurant-header', data);
        sectionHeaderEl
          .querySelector('.rating')
          .append(that.renderRating(data.avgRating));

        sectionHeaderEl
          .querySelector('.price')
          .append(that.renderPrice(data.price));
        return doc.ref.collection('ratings').orderBy('timestamp', 'desc').get();
      })
      .then(function (ratings) {
        var mainEl;

        if (ratings.size) {
          mainEl = that.renderTemplate('main');

          ratings.forEach(function (rating) {
            var data = rating.data();
            var el = that.renderTemplate('review-card', data);
            el.querySelector('.rating').append(that.renderRating(data.rating));
            mainEl.querySelector('#cards').append(el);
          });
        } else {
          mainEl = that.renderTemplate('no-ratings', {
            add_mock_data: function () {
              that.addMockRatings(id).then(function () {
                that.rerender();
              });
            },
          });
        }

        var headerEl = that.renderTemplate('header-base', {
          hasSectionHeader: true,
        });

        that.replaceElement(document.querySelector('.header'), sectionHeaderEl);
        that.replaceElement(document.querySelector('main'), mainEl);
      })
      .then(function () {
        that.router.updatePageLinks();
      })
      .catch(function (err) {
        console.warn('Error rendering page', err);
      });
  };

FriendlyEats.prototype.renderTemplate = function (id, data) {
  console.log('renderTemplate');
  var template = this.templates[id];
  var el = template.cloneNode(true);
  el.removeAttribute('hidden');
  this.render(el, data);
  return el;
};

FriendlyEats.prototype.render = function (el, data) {
  console.log('render');
  if (!data) {
    return;
  }

  var that = this;
  var modifiers = {
    'data-fir-foreach': function (tel) {
      var field = tel.getAttribute('data-fir-foreach');
      var values = that.getDeepItem(data, field);

      values.forEach(function (value, index) {
        var cloneTel = tel.cloneNode(true);
        tel.parentNode.append(cloneTel);

        Object.keys(modifiers).forEach(function (selector) {
          var children = Array.prototype.slice.call(
            cloneTel.querySelectorAll('[' + selector + ']')
          );
          children.push(cloneTel);
          children.forEach(function (childEl) {
            var currentVal = childEl.getAttribute(selector);

            if (!currentVal) {
              return;
            }

            childEl.setAttribute(
              selector,
              currentVal.replace('~', field + '/' + index)
            );
          });
        });
      });

      tel.parentNode.removeChild(tel);
    },

    'data-fir-content': function (tel) {
      var field = tel.getAttribute('data-fir-content');
      tel.innerText = that.getDeepItem(data, field);
    },

    'data-fir-click': function (tel) {
      tel.addEventListener('click', function () {
        var field = tel.getAttribute('data-fir-click');
        that.getDeepItem(data, field)();
      });
    },

    'data-fir-if': function (tel) {
      var field = tel.getAttribute('data-fir-if');
      if (!that.getDeepItem(data, field)) {
        tel.style.display = 'none';
      }
    },

    'data-fir-if-not': function (tel) {
      var field = tel.getAttribute('data-fir-if-not');
      if (that.getDeepItem(data, field)) {
        tel.style.display = 'none';
      }
    },

    'data-fir-attr': function (tel) {
      var chunks = tel.getAttribute('data-fir-attr').split(':');
      var attr = chunks[0];
      var field = chunks[1];
      tel.setAttribute(attr, that.getDeepItem(data, field));
    },

    'data-fir-style': function (tel) {
      var chunks = tel.getAttribute('data-fir-style').split(':');
      var attr = chunks[0];
      var field = chunks[1];
      var value = that.getDeepItem(data, field);

      if (attr.toLowerCase() === 'backgroundimage') {
        value = 'url(' + value + ')';
      }

      tel.style[attr] = value;
    },
  };

  var preModifiers = ['data-fir-foreach'];

  preModifiers.forEach(function (selector) {
    var modifier = modifiers[selector];
    that.useModifier(el, selector, modifier);
  });

  Object.keys(modifiers).forEach(function (selector) {
    if (preModifiers.indexOf(selector) !== -1) {
      return;
    }

    var modifier = modifiers[selector];
    that.useModifier(el, selector, modifier);
  });
};

FriendlyEats.prototype.useModifier = function (el, selector, modifier) {
  console.log('useModifier');
  el.querySelectorAll('[' + selector + ']').forEach(modifier);
};

FriendlyEats.prototype.getDeepItem = function (obj, path) {
  console.log('getDeepItem');
  path.split('/').forEach(function (chunk) {
    obj = obj[chunk];
  });

  return obj;
};

FriendlyEats.prototype.renderRating = function (rating) {
  var el = this.renderTemplate('rating', {});
  for (var r = 0; r < 5; r += 1) {
    var star;
    if (r < Math.floor(rating)) {
      star = this.renderTemplate('star-icon', {});
    } else {
      star = this.renderTemplate('star-border-icon', {});
    }

    el.append(star);
  }

  return el;
};

FriendlyEats.prototype.renderPrice = function (price) {
  console.log('renderPrice');
  var el = this.renderTemplate('price', {});
  for (var r = 0; r < price; r += 1) {
    el.append('$');
  }

  return el;
};

FriendlyEats.prototype.replaceElement = function (parent, content) {
  console.log('replaceElement');
  parent.innerHTML = '';
  parent.append(content);
};

FriendlyEats.prototype.rerender = function () {
  console.log('rerender');
  this.router.navigate(document.location.pathname + '?' + new Date().getTime());
};









//custme code of javascript for view
var add_view = document.getElementById('add_view');
var view_r = document.querySelector('main');

function view_re() {
  console.log(view_r);

  view_r.style.display = 'block';
  add_view.style.display = 'none';

};

function view_ad() {
  console.log(view_r);
  add_view.style.cssText = 'display:block;position:relative; top:80px;';
  view_r.style.display = 'none';

};

document.getElementById('add_r').addEventListener('onclick', view_ad());
document.getElementById('view_r').addEventListener('onclick', view_re());
