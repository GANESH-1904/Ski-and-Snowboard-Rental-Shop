/* ==========================================================================
   VÉRTEX ALPS — DASHBOARD CONTROLLER (dashboard.js)
   Premium ski + snowboard rental dashboard

   Features:
   1 Sidebar tabs
   2 Crew riders
   3 Smart equipment recommendations
   4 Reservation form + live booking summary
   5 Locker drop-off / return workflow
   6 Lesson add-ons
   7 Payment actions
   8 Rider profile persistence
   9 Booking persistence
   10 Image fallback protection
   11 Dashboard quick actions
   12 Demo account state
   ========================================================================== */

(function () {
  'use strict';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(sel)
    );
  }

  function notify(message) {
    if (typeof window.vertexToast === 'function') {
      window.vertexToast(message);
    }
  }

  function safeGet(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function getJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function formatMoney(value) {
    return '$' + Number(value || 0).toFixed(2);
  }

  function parseDate(value) {
    if (!value) return null;

    var date = new Date(value + 'T00:00:00');

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  function daysBetween(start, end) {
    var startDate = parseDate(start);
    var endDate = parseDate(end);

    if (!startDate || !endDate) {
      return 1;
    }

    var diff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) /
      (1000 * 60 * 60 * 24)
    );

    return Math.max(1, diff);
  }

  function repairImages() {
    $$('img').forEach(function (img) {
      if (img.dataset.vertexFallbackAttached) {
        return;
      }

      img.dataset.vertexFallbackAttached = 'true';

      img.addEventListener('error', function () {
        if (img.dataset.fallbackUsed) {
          return;
        }

        img.dataset.fallbackUsed = 'true';

        var fallback =
          'https://images.unsplash.com/photo-1486911278844-a81c5267e227' +
          '?auto=format&fit=crop&w=1200&q=80';

        img.src = fallback;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ======================================================================
       1. SIDEBAR TABS
       ====================================================================== */

    var navItems = $$('.side-nav-item[data-tab]');
    var sections = $$('.dash-tab-section');

    navItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var target = item.getAttribute('data-tab');

        navItems.forEach(function (btn) {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });

        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');

        sections.forEach(function (section) {
          var active = section.id === target;

          section.classList.toggle('active', active);

          if (active) {
            section.setAttribute('aria-hidden', 'false');
          } else {
            section.setAttribute('aria-hidden', 'true');
          }
        });

        safeSet('vertex_dashboard_tab', target);
      });
    });

    var savedTab = safeGet('vertex_dashboard_tab', '');

    if (savedTab) {
      var savedButton = document.querySelector(
        '.side-nav-item[data-tab="' + savedTab + '"]'
      );

      if (savedButton) {
        savedButton.click();
      }
    }

    /* ======================================================================
       2. CREW RIDERS
       ====================================================================== */

    var addCrewBtn = $('#add-crew-member-btn');
    var crewList = $('#crew-members-list');

    var riderNumber = 2;

    if (crewList) {
      riderNumber =
        crewList.querySelectorAll('.crew-rider-block').length + 2;
    }

    if (addCrewBtn && crewList) {

      addCrewBtn.addEventListener('click', function () {

        var block = document.createElement('div');

        block.className = 'grid-3 crew-rider-block';

        block.style.padding = '18px 0';
        block.style.gap = '20px';
        block.style.borderTop =
          '1px solid var(--border-color)';

        block.innerHTML =
          '<div>' +
            '<label class="form-label">' +
              'Rider ' + riderNumber + ' name' +
            '</label>' +
            '<input type="text" ' +
              'class="form-input crew-name" ' +
              'placeholder="e.g. Sarah Lindgren" ' +
              'autocomplete="name">' +
          '</div>' +

          '<div>' +
            '<label class="form-label">Package</label>' +
            '<select class="form-input crew-package">' +
              '<option value="all-mountain">Apex all-mountain ski package</option>' +
              '<option value="snowboard">Glacier twin snowboard</option>' +
              '<option value="junior">Junior grom performance ski</option>' +
              '<option value="touring">Summit touring setup</option>' +
            '</select>' +
          '</div>' +

          '<div>' +
            '<label class="form-label">Boot size, Mondo</label>' +
            '<div style="display:flex; gap:8px;">' +
              '<input type="text" ' +
                'class="form-input crew-boot" ' +
                'placeholder="e.g. 24.5">' +

              '<button type="button" ' +
                'class="btn btn-secondary btn-sm remove-rider-btn" ' +
                'aria-label="Remove this rider">' +
                '&times;' +
              '</button>' +
            '</div>' +
          '</div>';

        crewList.appendChild(block);

        notify(
          'Rider ' + riderNumber + ' added to the booking'
        );

        riderNumber++;

        var removeButton =
          block.querySelector('.remove-rider-btn');

        if (removeButton) {
          removeButton.addEventListener(
            'click',
            function () {
              block.remove();
              updateBookingSummary();
              notify('Rider removed from the booking');
            }
          );
        }

        updateBookingSummary();
      });
    }

    /* ======================================================================
       3. SMART EQUIPMENT RECOMMENDATION
       ====================================================================== */

    var category = $('#r-category');
    var ridingStyle = $('#r-type');

    function recommendGear() {

      if (!category || !ridingStyle) {
        return;
      }

      var recommendation =
        $('#gear-recommendation');

      if (!recommendation) {
        return;
      }

      var type = ridingStyle.value.toLowerCase();
      var equipment = category.value.toLowerCase();

      var title =
        'Your recommended setup';

      var description =
        'Our technicians will fine-tune the setup at pickup.';

      if (
        equipment.indexOf('snowboard') !== -1
      ) {
        title = 'Board setup recommended';

        description =
          'A directional freeride board with a medium-flex boot is a strong all-day choice for mixed resort terrain.';
      } else if (
        equipment.indexOf('touring') !== -1
      ) {
        title = 'Touring setup recommended';

        description =
          'Lightweight touring skis, tech-compatible boots and climbing skins will keep the uphill efficient without sacrificing downhill stability.';
      } else if (
        type.indexOf('aggressive') !== -1
      ) {
        title = 'Performance setup recommended';

        description =
          'Choose a stiffer ski with stronger edge hold and a performance boot for higher-speed resort riding.';
      } else if (
        type.indexOf('cautious') !== -1
      ) {
        title = 'Comfort setup recommended';

        description =
          'A forgiving all-mountain ski and comfortable boot package will give you predictable control throughout the day.';
      } else {
        title = 'All-mountain setup recommended';

        description =
          'A versatile 80–90 mm ski with a medium-flex boot is ideal for groomers, light powder and mixed resort conditions.';
      }

      recommendation.innerHTML =
        '<strong>' + title + '</strong>' +
        '<p style="margin:6px 0 0;color:var(--text-muted);">' +
          description +
        '</p>';

      recommendation.classList.add('show');
    }

    if (category) {
      category.addEventListener(
        'change',
        recommendGear
      );
    }

    if (ridingStyle) {
      ridingStyle.addEventListener(
        'change',
        recommendGear
      );
    }

    recommendGear();

    /* ======================================================================
       4. RESERVATION FORM
       ====================================================================== */

    var reserveForm = $('#gear-reserve-form');

    function getSelectedPackagePrice() {

      if (!category) {
        return 78;
      }

      var value = category.value.toLowerCase();

      if (value.indexOf('snowboard') !== -1) {
        return 84;
      }

      if (value.indexOf('touring') !== -1) {
        return 110;
      }

      if (value.indexOf('recreation') !== -1) {
        return 58;
      }

      return 78;
    }

    function updateBookingSummary() {

      var summary = $('#booking-summary');

      if (!summary) {
        return;
      }

      var start =
        $('#r-start-date') ||
        $('#r-date') ||
        $('[name="start-date"]');

      var end =
        $('#r-end-date') ||
        $('[name="end-date"]');

      var days =
        start && end
          ? daysBetween(start.value, end.value)
          : 1;

      var riderCount = 1;

      if (crewList) {
        riderCount +=
          crewList.querySelectorAll(
            '.crew-rider-block'
          ).length;
      }

      var dailyPrice =
        getSelectedPackagePrice();

      var total =
        dailyPrice *
        days *
        riderCount;

      var discount = 0;

      if (days >= 5) {
        discount = total * 0.10;
      } else if (days >= 3) {
        discount = total * 0.05;
      }

      var finalTotal =
        total - discount;

      summary.innerHTML =
        '<div style="display:flex;justify-content:space-between;gap:20px;">' +
          '<span>Riders</span>' +
          '<strong>' + riderCount + '</strong>' +
        '</div>' +

        '<div style="display:flex;justify-content:space-between;gap:20px;margin-top:8px;">' +
          '<span>Rental days</span>' +
          '<strong>' + days + '</strong>' +
        '</div>' +

        '<div style="display:flex;justify-content:space-between;gap:20px;margin-top:8px;">' +
          '<span>Estimated gear</span>' +
          '<strong>' + formatMoney(total) + '</strong>' +
        '</div>' +

        (
          discount > 0
            ? '<div style="display:flex;justify-content:space-between;gap:20px;margin-top:8px;color:var(--status-success);">' +
                '<span>Multi-day saving</span>' +
                '<strong>-' + formatMoney(discount) + '</strong>' +
              '</div>'
            : ''
        ) +

        '<div style="display:flex;justify-content:space-between;gap:20px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border-color);">' +
          '<strong>Estimated total</strong>' +
          '<strong style="font-size:1.15rem;color:var(--primary);">' +
            formatMoney(finalTotal) +
          '</strong>' +
        '</div>';
    }

    if (reserveForm) {

      reserveForm.addEventListener(
        'submit',
        function (event) {

          event.preventDefault();

          var ok = true;

          $$('[required]', reserveForm)
            .forEach(function (field) {

              var bad =
                !String(field.value || '').trim();

              field.classList.toggle(
                'invalid',
                bad
              );

              if (bad) {
                ok = false;
              }
            });

          if (!ok) {
            notify(
              'Fill in the highlighted fields to continue'
            );
            return;
          }

          var booking = {
            id:
              'VX-' +
              Math.floor(
                100000 +
                Math.random() * 900000
              ),

            equipment:
              category
                ? category.value
                : 'All-mountain performance skis',

            ridingStyle:
              ridingStyle
                ? ridingStyle.value
                : '',

            createdAt:
              new Date().toISOString(),

            days: 1
          };

          var start =
            $('#r-start-date') ||
            $('#r-date') ||
            $('[name="start-date"]');

          var end =
            $('#r-end-date') ||
            $('[name="end-date"]');

          if (start && end) {
            booking.days =
              daysBetween(
                start.value,
                end.value
              );
          }

          setJSON(
            'vertex_current_booking',
            booking
          );

          notify(
            'Booking ' +
            booking.id +
            ' confirmed — your gear is being prepared'
          );

          updateBookingSummary();

          var confirmation =
            $('#reservation-confirmation');

          if (confirmation) {

            confirmation.innerHTML =
              '<div class="note-box" style="margin-top:18px;">' +
                '<strong>Reservation confirmed.</strong>' +
                '<p style="margin:6px 0 0;">' +
                  'Booking <strong>' +
                    booking.id +
                  '</strong> is now attached to your rider profile. ' +
                  'Your locker assignment will appear here when the gear is ready.' +
                '</p>' +
              '</div>';
          }
        }
      );

      $$('[required]', reserveForm)
        .forEach(function (field) {

          field.addEventListener(
            'input',
            function () {
              field.classList.remove(
                'invalid'
              );
            }
          );

          field.addEventListener(
            'change',
            function () {
              field.classList.remove(
                'invalid'
              );
              updateBookingSummary();
            }
          );
        });
    }

    if (category) {
      category.addEventListener(
        'change',
        updateBookingSummary
      );
    }

    if (ridingStyle) {
      ridingStyle.addEventListener(
        'change',
        updateBookingSummary
      );
    }

    updateBookingSummary();

    /* ======================================================================
       5. LOCKER DROP-OFF / RETURN
       ====================================================================== */

    var dropOffBtn =
      $('#locker-dropoff-btn');

    var dropOffFeedback =
      $('#locker-dropoff-feedback');

    if (
      dropOffBtn &&
      dropOffFeedback
    ) {

      dropOffBtn.addEventListener(
        'click',
        function () {

          if (dropOffBtn.disabled) {
            return;
          }

          dropOffBtn.disabled = true;

          dropOffBtn.textContent =
            'Drop-off recorded';

          dropOffFeedback.innerHTML =
            '<div class="note-box" style="margin-top:18px;">' +

              '<strong>Gear checked in successfully.</strong>' +

              '<p style="margin:7px 0 0;">' +
                'Your skis and boots have been marked as returned. ' +
                'The equipment is now in the drying and inspection cycle.' +
              '</p>' +

              '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +

                '<span class="status-pill ok">' +
                  'Returned' +
                '</span>' +

                '<span class="status-pill info">' +
                  'Inspection queued' +
                '</span>' +

              '</div>' +

            '</div>';

          safeSet(
            'vertex_last_return',
            new Date().toISOString()
          );

          notify(
            'Gear return recorded successfully'
          );
        }
      );
    }

    /* ======================================================================
       6. LESSON ADD-ONS
       ====================================================================== */

    $$('.add-lesson-btn')
      .forEach(function (btn) {

        btn.addEventListener(
          'click',
          function () {

            if (btn.disabled) {
              return;
            }

            var name =
              btn.getAttribute(
                'data-lesson'
              ) || 'Lesson';

            var price =
              Number(
                btn.getAttribute(
                  'data-price'
                ) || 0
              );

            btn.textContent =
              'Added ✓';

            btn.classList.remove(
              'btn-primary'
            );

            btn.classList.add(
              'btn-secondary'
            );

            btn.disabled = true;

            var lessons =
              getJSON(
                'vertex_lessons',
                []
              );

            lessons.push({
              name: name,
              price: price,
              addedAt:
                new Date().toISOString()
            });

            setJSON(
              'vertex_lessons',
              lessons
            );

            notify(
              name +
              ' added to your plan'
            );
          }
        );
      });

    /* ======================================================================
       7. PAYMENT ACTIONS
       ====================================================================== */

    $$('.payment-action-btn')
      .forEach(function (btn) {

        btn.addEventListener(
          'click',
          function () {

            var message =
              btn.getAttribute(
                'data-message'
              ) ||
              'Payment settings updated';

            notify(message);

            var original =
              btn.textContent;

            btn.textContent =
              'Updated ✓';

            btn.disabled = true;

            setTimeout(
              function () {
                btn.textContent =
                  original;
                btn.disabled = false;
              },
              2200
            );
          }
        );
      });

    /* ======================================================================
       8. RIDER PROFILE
       ====================================================================== */

    var profileForm =
      $('#rider-profile-form');

    if (profileForm) {

      var savedProfile =
        getJSON(
          'vertex_rider_profile',
          null
        );

      if (savedProfile) {

        Object.keys(savedProfile)
          .forEach(function (key) {

            var field =
              profileForm.querySelector(
                '[name="' + key + '"]'
              );

            if (field) {
              field.value =
                savedProfile[key];
            }
          });
      }

      profileForm.addEventListener(
        'submit',
        function (event) {

          event.preventDefault();

          var profile = {};

          $$(
            'input[name], select[name], textarea[name]',
            profileForm
          ).forEach(function (field) {

            profile[field.name] =
              field.value;
          });

          setJSON(
            'vertex_rider_profile',
            profile
          );

          notify(
            'Rider profile saved securely on this device'
          );
        }
      );
    }

    /* ======================================================================
       9. DASHBOARD BOOKING STATE
       ====================================================================== */

    var currentBooking =
      getJSON(
        'vertex_current_booking',
        null
      );

    if (currentBooking) {

      var bookingBadge =
        $('#current-booking-id');

      if (bookingBadge) {
        bookingBadge.textContent =
          currentBooking.id;
      }

      var bookingEquipment =
        $('#current-booking-equipment');

      if (bookingEquipment) {
        bookingEquipment.textContent =
          currentBooking.equipment;
      }

      var bookingDays =
        $('#current-booking-days');

      if (bookingDays) {
        bookingDays.textContent =
          currentBooking.days +
          (currentBooking.days === 1
            ? ' day'
            : ' days');
      }
    }

    /* ======================================================================
       10. QUICK ACTION BUTTONS
       ====================================================================== */

    $$('.dash-quick-action')
      .forEach(function (button) {

        button.addEventListener(
          'click',
          function () {

            var target =
              button.getAttribute(
                'data-target'
              );

            if (!target) {
              return;
            }

            var targetButton =
              document.querySelector(
                '.side-nav-item[data-tab="' +
                  target +
                '"]'
              );

            if (targetButton) {
              targetButton.click();

              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }
          }
        );
      });

    /* ======================================================================
       11. IMAGE FALLBACKS
       ====================================================================== */

    repairImages();

    /* ======================================================================
       12. KEYBOARD FRIENDLY DASHBOARD
       ====================================================================== */

    document.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Escape'
        ) {
          var activeModal =
            $('.modal-overlay.open');

          if (activeModal) {
            activeModal.classList.remove(
              'open'
            );
          }
        }
      }
    );

  });

})();