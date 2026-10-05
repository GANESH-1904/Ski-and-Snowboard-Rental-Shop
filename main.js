/* ==========================================================================
   VÉRTEX ALPS — SITE ENGINE (main.js)
   Loaded on every page. Every block no-ops safely if its markup is absent.
   1 Theme · 2 Direction · 3 Mobile nav · 4 Header state · 5 Gear bag
   6 Snowfall · 7 Modal · 8 FAQ · 9 Boot hotspots · 10 Scroll reveal
   11 Back to top · 12 Toast · 13 Newsletter · 14 Contact form · 15 Password
   16 Rental cost estimator · 17 Boot & ski size converter
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(sel)
    );
  }

  function store(key, value) {
    try {
      if (value === undefined) {
        return localStorage.getItem(key);
      }

      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
  }

  /* ----------------------------- 12. TOAST ------------------------------ */

  var toastTimer = null;

  function toast(message) {
    var el = $('#toast');
    var text = $('#toast-text');

    if (!el || !text) {
      return;
    }

    text.textContent = message;
    el.classList.add('show');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 3200);
  }

  window.vertexToast = toast;

  document.addEventListener('DOMContentLoaded', function () {

    /* --------------------------- 1. THEME ------------------------------ */

    if (store('vertex_theme') === 'dark') {
      document.body.classList.add('dark-mode');
    }

    document.documentElement.classList.remove('pre-dark');

    $$('#theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');

        var isDark = document.body.classList.contains('dark-mode');

        store(
          'vertex_theme',
          isDark ? 'dark' : 'light'
        );

        toast(
          isDark ? 'Dark mode on' : 'Light mode on'
        );
      });
    });


    /* ------------------------- 2. DIRECTION ---------------------------- */

    document.documentElement.setAttribute(
      'dir',
      store('vertex_rtl') === 'true' ? 'rtl' : 'ltr'
    );

    $$('#rtl-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {

        var isRTL =
          document.documentElement.getAttribute('dir') === 'rtl';

        document.documentElement.setAttribute(
          'dir',
          isRTL ? 'ltr' : 'rtl'
        );

        store(
          'vertex_rtl',
          isRTL ? 'false' : 'true'
        );

        toast(
          isRTL
            ? 'Left to right layout'
            : 'Right to left layout'
        );
      });
    });


    /* ------------------------- 3. MOBILE NAV --------------------------- */

    var mobileToggle = $('#mobile-toggle');
    var navMenu = $('#nav-menu');

    if (mobileToggle && navMenu) {

      /* Mobile menu button */
      mobileToggle.addEventListener('click', function () {

        var open =
          navMenu.classList.toggle('active');

        mobileToggle.setAttribute(
          'aria-expanded',
          open ? 'true' : 'false'
        );
      });


      /*
       * RESPONSIVE NAVIGATION FIX
       *
       * At 1024px and below, the Home dropdown behaves properly on
       * tablet/touch screens.
       *
       * First tap:
       *   Opens Home dropdown.
       *
       * Second tap:
       *   Allows the Home link to navigate normally.
       *
       * On mobile:
       *   Existing mobile menu behaviour remains unchanged.
       */

      $$('.nav-link, .dropdown-item', navMenu).forEach(function (link) {

        link.addEventListener('click', function (event) {

          var dropdownWrapper =
            link.closest('.nav-dropdown-wrapper');

          var tabletDropdown =
            window.matchMedia(
              '(min-width: 769px) and (max-width: 1024px)'
            ).matches;


          /*
           * TABLET HOME DROPDOWN
           *
           * The first tap on Home opens the dropdown instead of
           * immediately navigating away.
           */
          if (
            dropdownWrapper &&
            tabletDropdown &&
            link.classList.contains('nav-link')
          ) {

            var dropdown =
              $('.nav-dropdown-menu', dropdownWrapper);

            if (
              dropdown &&
              !dropdownWrapper.classList.contains('open')
            ) {

              event.preventDefault();

              /*
               * Close any other open dropdown first.
               */
              $$('.nav-dropdown-wrapper.open').forEach(
                function (other) {

                  if (other !== dropdownWrapper) {
                    other.classList.remove('open');
                  }

                }
              );

              /*
               * Open Home dropdown.
               */
              dropdownWrapper.classList.add('open');

              return;
            }
          }


          /*
           * Normal navigation.
           */
          navMenu.classList.remove('active');

          mobileToggle.setAttribute(
            'aria-expanded',
            'false'
          );


          /*
           * Close any tablet dropdown after navigation.
           */
          $$('.nav-dropdown-wrapper.open').forEach(
            function (wrapper) {
              wrapper.classList.remove('open');
            }
          );

        });

      });


      /*
       * Close the dropdown when clicking anywhere outside it.
       */
      document.addEventListener('click', function (event) {

        if (
          !event.target.closest('.nav-dropdown-wrapper')
        ) {

          $$('.nav-dropdown-wrapper.open').forEach(
            function (wrapper) {
              wrapper.classList.remove('open');
            }
          );

        }

      });

    }


    /* ------------------------ 4. HEADER STATE -------------------------- */

    var header = $('.header');
    var backTop = $('#back-to-top');

    function onScroll() {

      var y = window.pageYOffset;

      if (header) {
        header.classList.toggle(
          'scrolled',
          y > 8
        );
      }

      if (backTop) {
        backTop.classList.toggle(
          'show',
          y > 520
        );
      }

    }

    window.addEventListener(
      'scroll',
      onScroll,
      { passive: true }
    );

    onScroll();


    if (backTop) {

      backTop.addEventListener('click', function () {

        window.scrollTo({
          top: 0,
          behavior: reduceMotion
            ? 'auto'
            : 'smooth'
        });

      });

    }


    /* --------------------------- 5. GEAR BAG --------------------------- */

    var cart = [];

    try {
      cart =
        JSON.parse(
          store('vertex_cart')
        ) || [];
    } catch (e) {
      cart = [];
    }

    if (!Array.isArray(cart)) {
      cart = [];
    }


    function saveCart() {
      store(
        'vertex_cart',
        JSON.stringify(cart)
      );
    }


    function countItems() {

      return cart.reduce(
        function (sum, item) {
          return sum + (item.qty || 1);
        },
        0
      );

    }


    function cartTotal() {

      return cart.reduce(
        function (sum, item) {
          return sum +
            item.price *
            (item.qty || 1);
        },
        0
      );

    }


    function renderCart(bump) {

      var badge =
        $('#cart-badge');

      var container =
        $('#cart-items-container');

      var totalEl =
        $('#cart-total-price');


      if (badge) {

        badge.textContent =
          countItems();

        if (bump) {

          badge.classList.remove('bump');

          void badge.offsetWidth;

          badge.classList.add('bump');
        }

      }


      if (totalEl) {

        totalEl.textContent =
          '$' +
          cartTotal().toFixed(2);

      }


      if (!container) {
        return;
      }


      if (cart.length === 0) {

        container.innerHTML =
          '<p class="cart-empty">' +
          'Your gear bag is empty. Add a package from the fleet, ' +
          'a clinic from the academy, or a rate from the pricing page.' +
          '</p>';

        return;
      }


      container.innerHTML =
        cart.map(function (item, index) {

          return '' +

            '<div class="cart-item-row">' +

              '<div>' +

                '<strong>' +
                  item.title +
                '</strong>' +

                '<small>$' +
                  item.price +
                  ' per day</small>' +

              '</div>' +

              '<div class="qty-group">' +

                '<button ' +
                  'class="qty-btn" ' +
                  'data-action="dec" ' +
                  'data-index="' +
                    index +
                  '" ' +
                  'aria-label="Remove one">' +
                  '&minus;' +
                '</button>' +

                '<span>' +
                  (item.qty || 1) +
                '</span>' +

                '<button ' +
                  'class="qty-btn" ' +
                  'data-action="inc" ' +
                  'data-index="' +
                    index +
                  '" ' +
                  'aria-label="Add one">' +
                  '+' +
                '</button>' +

                '<button ' +
                  'class="cart-remove" ' +
                  'data-action="del" ' +
                  'data-index="' +
                    index +
                  '" ' +
                  'aria-label="Remove item">' +
                  '&times;' +
                '</button>' +

              '</div>' +

            '</div>';

        }).join('');

    }


    var cartContainer =
      $('#cart-items-container');


    if (cartContainer) {

      cartContainer.addEventListener(
        'click',
        function (event) {

          var btn =
            event.target.closest(
              '[data-action]'
            );

          if (!btn) {
            return;
          }


          var index =
            parseInt(
              btn.getAttribute('data-index'),
              10
            );

          var action =
            btn.getAttribute(
              'data-action'
            );


          if (
            isNaN(index) ||
            !cart[index]
          ) {
            return;
          }


          if (action === 'inc') {

            cart[index].qty =
              (cart[index].qty || 1) + 1;

          }


          if (action === 'dec') {

            cart[index].qty =
              (cart[index].qty || 1) - 1;

            if (cart[index].qty < 1) {
              cart.splice(index, 1);
            }

          }


          if (action === 'del') {
            cart.splice(index, 1);
          }


          saveCart();

          renderCart(true);

        }
      );

    }


    var cartDrawer =
      $('#cart-drawer');

    var cartOverlay =
      $('#cart-drawer-overlay');


    function openCart() {

      if (
        !cartDrawer ||
        !cartOverlay
      ) {
        return;
      }

      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');

    }


    function closeCart() {

      if (
        !cartDrawer ||
        !cartOverlay
      ) {
        return;
      }

      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');

    }


    var openCartBtn =
      $('#open-cart-btn');

    var closeCartBtn =
      $('#close-cart-btn');

    var clearCartBtn =
      $('#clear-cart-btn');


    if (openCartBtn) {
      openCartBtn.addEventListener(
        'click',
        openCart
      );
    }


    if (closeCartBtn) {
      closeCartBtn.addEventListener(
        'click',
        closeCart
      );
    }


    if (cartOverlay) {
      cartOverlay.addEventListener(
        'click',
        closeCart
      );
    }


    if (clearCartBtn) {

      clearCartBtn.addEventListener(
        'click',
        function () {

          cart = [];

          saveCart();

          renderCart(true);

          toast(
            'Gear bag emptied'
          );

        }
      );

    }


    document.addEventListener(
      'keydown',
      function (event) {

        if (event.key !== 'Escape') {
          return;
        }

        closeCart();

        $$('.modal-overlay.open')
          .forEach(function (m) {
            m.classList.remove('open');
          });

      }
    );


    $$('.add-to-cart-btn')
      .forEach(function (btn) {

        btn.addEventListener(
          'click',
          function () {

            var title =
              btn.getAttribute(
                'data-title'
              );

            var price =
              parseFloat(
                btn.getAttribute(
                  'data-price'
                )
              );


            if (
              !title ||
              isNaN(price)
            ) {
              return;
            }


            var existing = null;


            for (
              var i = 0;
              i < cart.length;
              i++
            ) {

              if (
                cart[i].title === title
              ) {

                existing =
                  cart[i];

                break;
              }

            }


            if (existing) {

              existing.qty =
                (existing.qty || 1) + 1;

            } else {

              cart.push({
                title: title,
                price: price,
                qty: 1
              });

            }


            saveCart();

            renderCart(true);

            openCart();

            toast(
              title +
              ' added to your gear bag'
            );

          }
        );

      });


    renderCart(false);


    /* --------------------------- 6. SNOWFALL --------------------------- */

    var canvas =
      $('#snow-canvas');


    if (
      canvas &&
      canvas.getContext &&
      !reduceMotion
    ) {

      var ctx =
        canvas.getContext('2d');

      var width =
        canvas.width =
          canvas.offsetWidth;

      var height =
        canvas.height =
          canvas.offsetHeight;

      var flakes = [];

      var total =
        window.innerWidth < 700
          ? 42
          : 85;


      for (
        var f = 0;
        f < total;
        f++
      ) {

        flakes.push({

          x:
            Math.random() *
            width,

          y:
            Math.random() *
            height,

          r:
            Math.random() *
            3 +
            1.2,

          d:
            Math.random() *
            1.2 +
            0.6,

          o:
            Math.random() *
            0.6 +
            0.35

        });

      }


      var resizeTimer = null;


      window.addEventListener(
        'resize',
        function () {

          clearTimeout(
            resizeTimer
          );

          resizeTimer =
            setTimeout(
              function () {

                width =
                  canvas.width =
                    canvas.offsetWidth;

                height =
                  canvas.height =
                    canvas.offsetHeight;

              },
              150
            );

        }
      );


      (function renderSnow() {

        ctx.clearRect(
          0,
          0,
          width,
          height
        );

        var dark =
          document.body.classList.contains(
            'dark-mode'
          );


        for (
          var i = 0;
          i < flakes.length;
          i++
        ) {

          var flake =
            flakes[i];


          ctx.beginPath();

          ctx.arc(
            flake.x,
            flake.y,
            flake.r,
            0,
            Math.PI * 2,
            true
          );


          if (dark) {

            ctx.fillStyle =
              'rgba(255, 255, 255, ' +
              flake.o +
              ')';

            ctx.shadowBlur = 4;

            ctx.shadowColor =
              'rgba(255, 255, 255, 0.5)';

          } else {

            ctx.fillStyle =
              'rgba(0, 164, 228, ' +
              (flake.o * 0.7) +
              ')';

            ctx.shadowBlur = 3;

            ctx.shadowColor =
              'rgba(0, 164, 228, 0.3)';

          }


          ctx.fill();


          flake.y +=
            flake.d;

          flake.x +=
            Math.sin(
              flake.y * 0.015
            ) * 0.6;


          if (
            flake.y > height
          ) {

            flake.y = -6;

            flake.x =
              Math.random() *
              width;

          }

        }


        requestAnimationFrame(
          renderSnow
        );

      })();

    }


    /* ---------------------------- 7. MODAL ----------------------------- */

    var openModalBtn =
      $('#open-intel-btn');

    var closeModalBtn =
      $('#close-intel-btn');

    var modal =
      $('#intel-modal');


    if (
      openModalBtn &&
      modal
    ) {

      openModalBtn.addEventListener(
        'click',
        function () {
          modal.classList.add('open');
        }
      );


      modal.addEventListener(
        'click',
        function (event) {

          if (
            event.target === modal
          ) {

            modal.classList.remove(
              'open'
            );

          }

        }
      );

    }


    if (
      closeModalBtn &&
      modal
    ) {

      closeModalBtn.addEventListener(
        'click',
        function () {
          modal.classList.remove(
            'open'
          );
        }
      );

    }


    /* ----------------------------- 8. FAQ ------------------------------ */

    $$('.faq-question')
      .forEach(function (question) {

        question.setAttribute(
          'aria-expanded',
          'false'
        );


        question.addEventListener(
          'click',
          function () {

            var item =
              question.closest(
                '.faq-item'
              );

            var answer =
              $('.faq-answer', item);

            var isOpen =
              item.classList.contains(
                'open'
              );


            $$('.faq-item.open')
              .forEach(
                function (other) {

                  other.classList.remove(
                    'open'
                  );

                  var a =
                    $('.faq-answer', other);

                  if (a) {
                    a.style.maxHeight = null;
                  }

                  var q =
                    $('.faq-question', other);

                  if (q) {
                    q.setAttribute(
                      'aria-expanded',
                      'false'
                    );
                  }

                }
              );


            if (!isOpen) {

              item.classList.add(
                'open'
              );

              question.setAttribute(
                'aria-expanded',
                'true'
              );

              if (answer) {

                answer.style.maxHeight =
                  answer.scrollHeight +
                  'px';

              }

            }

          }
        );

      });


    /* ------------------------- 9. BOOT HOTSPOTS ------------------------ */

    var hotspots =
      $$('.hotspot-pill');

    var hotspotDesc =
      $('#hotspot-desc');


    if (
      hotspots.length &&
      hotspotDesc
    ) {

      hotspots.forEach(
        function (pill) {

          pill.addEventListener(
            'click',
            function () {

              hotspots.forEach(
                function (p) {
                  p.classList.remove(
                    'active'
                  );
                }
              );


              pill.classList.add(
                'active'
              );


              hotspotDesc.innerHTML =
                '<strong>' +
                pill.getAttribute(
                  'data-name'
                ) +
                ':</strong> ' +
                pill.getAttribute(
                  'data-info'
                );

            }
          );

        }
      );

    }


    /* ------------------------ 10. SCROLL REVEAL ------------------------ */

    if (
      !reduceMotion &&
      'IntersectionObserver' in window
    ) {

      var revealTargets =
        $$([
          '.section .section-header',
          '.section .grid-2',
          '.section .grid-3',
          '.section .grid-4',
          '.gallery-grid',
          '.faq-list',
          '.stats-strip',
          '.newsletter-box',
          '.timeline',
          '.table-wrap',
          '.split-panel'
        ].join(','));


      revealTargets.forEach(
        function (el) {
          el.classList.add(
            'reveal'
          );
        }
      );


      var observer =
        new IntersectionObserver(
          function (entries) {

            entries.forEach(
              function (entry) {

                if (
                  entry.isIntersecting
                ) {

                  entry.target.classList.add(
                    'visible'
                  );

                  observer.unobserve(
                    entry.target
                  );

                }

              }
            );

          },
          {
            threshold: 0.1,
            rootMargin:
              '0px 0px -40px 0px'
          }
        );


      revealTargets.forEach(
        function (el) {
          observer.observe(el);
        }
      );

    }


    /* -------------------------- 13. NEWSLETTER ------------------------- */

    var newsletterForm =
      $('#newsletter-form');


    if (newsletterForm) {

      newsletterForm.addEventListener(
        'submit',
        function (event) {

          event.preventDefault();


          var input =
            $('#newsletter-email');

          var msg =
            $('#newsletter-msg');


          var valid =
            input &&
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
              .test(
                input.value.trim()
              );


          if (!valid) {

            toast(
              'Enter a valid email address to get the snow report'
            );

            if (input) {
              input.focus();
            }

            return;
          }


          if (msg) {
            msg.classList.add('show');
          }


          newsletterForm.reset();


          toast(
            'Subscribed. Your first snow report arrives at 6am'
          );

        }
      );

    }


    /* ------------------------- 14. CONTACT FORM ------------------------ */

    var contactForm =
      $('#contact-form');


    if (contactForm) {

      contactForm.addEventListener(
        'submit',
        function (event) {

          event.preventDefault();

          var ok = true;


          $$('[required]', contactForm)
            .forEach(
              function (field) {

                var value =
                  field.value.trim();


                var bad =
                  !value ||
                  (
                    field.type === 'email' &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
                      .test(value)
                  );


                field.classList.toggle(
                  'invalid',
                  bad
                );


                if (
                  bad &&
                  ok
                ) {
                  field.focus();
                }


                if (bad) {
                  ok = false;
                }

              }
            );


          if (!ok) {

            toast(
              'Check the highlighted fields and send again'
            );

            return;
          }


          contactForm.reset();


          toast(
            'Message sent. The depot team replies within about two hours'
          );

        }
      );


      $$('[required]', contactForm)
        .forEach(
          function (field) {

            field.addEventListener(
              'input',
              function () {
                field.classList.remove(
                  'invalid'
                );
              }
            );

          }
        );

    }


    /* ------------------------ 15. PASSWORD FIELD ----------------------- */

    $$('.pwd-toggle-btn')
      .forEach(function (btn) {

        btn.addEventListener(
          'click',
          function () {

            var input =
              btn.parentElement.querySelector(
                'input'
              );


            if (!input) {
              return;
            }


            input.type =
              input.type === 'password'
                ? 'text'
                : 'password';


            btn.setAttribute(
              'aria-label',
              input.type === 'password'
                ? 'Show password'
                : 'Hide password'
            );

          }
        );

      });


    /* ------------------- 16. RENTAL COST ESTIMATOR ---------------------

       Lives on pricing.html.
       Recalculates live as the guest changes package,
       day count or rider count.
    */

    var estPackage =
      $('#est-package');

    var estDays =
      $('#est-days');

    var estRiders =
      $('#est-riders');

    var estTotal =
      $('#est-total');

    var estBreakdown =
      $('#est-breakdown');

    var estAddBtn =
      $('#est-add-btn');


    function runEstimator() {

      if (
        !estPackage ||
        !estDays ||
        !estRiders ||
        !estTotal
      ) {
        return;
      }


      var rate =
        parseFloat(
          estPackage.value
        ) || 0;


      var packageName =
        estPackage
          .options[
            estPackage.selectedIndex
          ]
          .text;


      var days =
        Math.max(
          1,
          parseInt(
            estDays.value,
            10
          ) || 1
        );


      var riders =
        Math.max(
          1,
          parseInt(
            estRiders.value,
            10
          ) || 1
        );


      var base =
        rate *
        days *
        riders;


      var notes = [];

      var discount = 0;


      if (days >= 7) {

        discount = 0.25;

        notes.push(
          '7+ days: 25% off'
        );

      } else if (days >= 5) {

        discount = 0.17;

        notes.push(
          '5+ days: 6th day free (~17% off)'
        );

      } else if (days >= 3) {

        notes.push(
          '3+ days: free overnight storage'
        );

      }


      if (riders >= 8) {

        discount =
          Math.max(
            discount,
            0.20
          );

        notes.push(
          '8+ riders: 20% group rate'
        );

      } else if (riders >= 3) {

        discount =
          Math.max(
            discount,
            0.15
          );

        notes.push(
          '3+ riders: 15% family rate'
        );

      }


      var total =
        base *
        (1 - discount);


      estTotal.textContent =
        '$' +
        total.toFixed(2);


      if (estBreakdown) {

        estBreakdown.textContent =
          packageName +
          ' × ' +
          riders +
          ' rider' +
          (riders > 1 ? 's' : '') +
          ' × ' +
          days +
          ' day' +
          (days > 1 ? 's' : '') +
          (
            notes.length
              ? '  •  ' +
                notes.join(', ')
              : ''
          );

      }


      if (estAddBtn) {

        estAddBtn.setAttribute(
          'data-title',
          packageName +
          ' (' +
          riders +
          ' rider' +
          (riders > 1 ? 's' : '') +
          ', ' +
          days +
          ' day' +
          (days > 1 ? 's' : '') +
          ')'
        );


        estAddBtn.setAttribute(
          'data-price',
          total.toFixed(2)
        );

      }

    }


    if (
      estPackage &&
      estDays &&
      estRiders
    ) {

      [
        estPackage,
        estDays,
        estRiders
      ].forEach(
        function (el) {

          el.addEventListener(
            'input',
            runEstimator
          );

          el.addEventListener(
            'change',
            runEstimator
          );

        }
      );


      runEstimator();

    }


    /* ---------------- 17. BOOT & SKI SIZE CONVERTER ---------------------

       Lives on rentals.html.
       Converts a rider's height into a suggested Mondopoint
       boot size and ski/board length range.
    */

    var sizeHeight =
      $('#size-height');

    var sizeAbility =
      $('#size-ability');

    var sizeOutput =
      $('#size-convert-output');


    function runSizeConverter() {

      if (
        !sizeHeight ||
        !sizeOutput
      ) {
        return;
      }


      var cm =
        parseFloat(
          sizeHeight.value
        );


      if (
        !cm ||
        cm < 90 ||
        cm > 230
      ) {

        sizeOutput.innerHTML =
          '<span class="status-pill info">' +
          'Enter a height between 90 and 230cm' +
          '</span>';

        return;
      }


      var ability =
        sizeAbility
          ? sizeAbility.value
          : 'confident';


      var mondo =
        Math.round(
          (
            (cm * 0.15) +
            8
          ) * 2
        ) / 2;


      var skiFactor =
        ability === 'beginner'
          ? 0.86
          : (
              ability === 'advanced'
                ? 0.96
                : 0.91
            );


      var skiLen =
        Math.round(
          cm * skiFactor
        );


      var boardLen =
        Math.round(
          cm *
          (skiFactor - 0.02)
        );


      sizeOutput.innerHTML =

        '<span class="status-pill info">' +
        'Approx. boot size: Mondo ' +
        mondo.toFixed(1) +
        '</span>' +

        '<span class="status-pill ok">' +
        'Ski length: ' +
        (skiLen - 4) +
        '–' +
        (skiLen + 4) +
        'cm' +
        '</span>' +

        '<span class="status-pill warn">' +
        'Board length: ' +
        (boardLen - 4) +
        '–' +
        (boardLen + 4) +
        'cm' +
        '</span>';

    }


    if (sizeHeight) {

      sizeHeight.addEventListener(
        'input',
        runSizeConverter
      );

      if (sizeAbility) {

        sizeAbility.addEventListener(
          'change',
          runSizeConverter
        );

      }

    }

  });

})();