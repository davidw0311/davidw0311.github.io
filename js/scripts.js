// /*!
// * Start Bootstrap - Resume v7.0.4 (https://startbootstrap.com/theme/resume)
// * Copyright 2013-2021 Start Bootstrap
// * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
// */
// //
// // Scripts
// // 

/*!
* Start Bootstrap - Resume v7.0.4 (https://startbootstrap.com/theme/resume)
* Copyright 2013-2021 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
*/
//
// Scripts
// 


window.onload = function() {
    if (window.location.hash) {
      var id = window.location.hash.slice(1); // Remove the '#' from the hash
      var element = document.getElementById(id);
      if (element) element.scrollIntoView();
    }
  };

window.addEventListener('DOMContentLoaded', event => {

    // Activate Bootstrap scrollspy on the main nav element
    const sideNav = document.body.querySelector('#sideNav');
    if (sideNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    

});

document.addEventListener('DOMContentLoaded', function() {
    var links = document.querySelectorAll('.lazy-load');
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var url = this.dataset.href;
            window.open(url, '_blank');
        });
    });
});

// const myModal = document.getElementById('myModal')
// const myInput = document.getElementById('myInput')

// element.addEventListener('shown.bs.modal', () => {
//     myInput.focus()
//     })



// const navLinks = document.querySelectorAll('.nav-item')
// const menuToggle = document.getElementById('navbarResponsive')
// const bsCollapse = new bootstrap.Collapse(menuToggle, {toggle:false})
// navLinks.forEach((l) => {l.addEventListener('click', () => { bsCollapse.toggle() })
// })
// // let slideIndex = 0;
// // showSlides();

// // function showSlides() {
// //   let i;
// //   let slides = document.getElementsByClassName("mySlides");
// //   for (i = 0; i < slides.length; i++) {
// //     slides[i].style.display = "none";
// //   }
// //   slideIndex++;
// //   if (slideIndex > slides.length) {slideIndex = 1}
// //   slides[slideIndex-1].style.display = "block";
// //   setTimeout(showSlides, 2000); // Change image every 2 seconds
// // }


// // window.addEventListener('DOMContentLoaded', event => {

// //     // Activate Bootstrap scrollspy on the main nav element
// //     const sideNav = document.body.querySelector('#sideNav');
// //     if (sideNav) {
// //         new bootstrap.ScrollSpy(document.body, {
// //             target: '#sideNav',
// //             offset: 74,
// //         });
// //     };

// //     // Collapse responsive navbar when toggler is visible
// //     const navbarToggler = document.body.querySelector('.navbar-toggler');
// //     const responsiveNavItems = [].slice.call(
// //         document.querySelectorAll('#navbarResponsive .nav-link')
// //     );
// //     responsiveNavItems.map(function (responsiveNavItem) {
// //         responsiveNavItem.addEventListener('click', () => {
// //             if (window.getComputedStyle(navbarToggler).display !== 'none') {
// //                 navbarToggler.click();
// //             }
// //         });
// //     });

// // });




