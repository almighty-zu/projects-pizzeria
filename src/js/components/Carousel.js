/*global Flickity */

class Carousel {
  constructor(element) {
    const thisCarousel = this;
    thisCarousel.render(element);
    thisCarousel.initPlugin();
  }

  render(element) {
    const thisCarousel = this;

    thisCarousel.wrapper = element;
  }

  initPlugin() {

    const thisCarousel = this;

    thisCarousel.init = new Flickity (thisCarousel.wrapper, {
      cellAlign: 'left',
      contain: true,
      prevNextButtons: false,
      autoPlay: true,
    });
  }
}

export default Carousel;
