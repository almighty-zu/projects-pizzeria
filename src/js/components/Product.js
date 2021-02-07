import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';


class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
    //console.log('new Product:', thisProduct);
  }
  renderInMenu() {
    const thisProduct = this;
    /*generate HTML based on template*/
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /*create element using utils.createElementFromHTML*/
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    /*find menu container*/
    const menuContainer = document.querySelector(select.containerOf.menu);
    /*add element to menu*/
    menuContainer.appendChild(thisProduct.element);
  }
  getElements() {
    const thisProduct = this;
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }
  initAccordion() {
    const thisProduct = this;
    /*find the cliclable trigger(the element that should react to clicking)*/
    //const clickableTrigger = thisProduct.accordionTrigger;
    //console.log('clickableTrigger:', clickableTrigger);
    /*START: add event listener to clickable trigger on event click*/
    thisProduct.accordionTrigger.addEventListener('click', function (event) {
      /*prevent default action for event*/
      event.preventDefault();
      /*find active product(product that has active class)*/
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      //console.log('active product:', activeProduct);
      /*if there is active product and it's not thisProduct.element, remove class active from it*/
      if (activeProduct !== thisProduct.element && activeProduct !== null) {
        activeProduct.classList.remove('active');
      }
      /*toggle active class on thisProduct.element*/
      thisProduct.element.classList.toggle('active');
    });
  }
  initOrderForm() {
    const thisProduct = this;
    //console.log('thisProduct.initOrderForm', thisProduct);
    thisProduct.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
    });
    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function () {
        thisProduct.processOrder();
      });
    }
    thisProduct.cartButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }
  processOrder() {
    const thisProduct = this;
    //console.log('thisProduct.processOrder', thisProduct);
    //convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData', formData);
    //set price to default price
    let price = thisProduct.data.price;
    //for every category (param)...
    for (let paramId in thisProduct.data.params) {
      //determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes' ...}
      const param = thisProduct.data.params[paramId];
      //console.log(paramId, param);
      //for every option in this category
      for (let optionId in param.options) {
        const option = param.options[optionId];
        //console.log(optionId, option);
        //check if there is param with name of paramId in formData and if it includes optionId
        const selectedOption = formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId);
        //console.log('selectedOption', selectedOption);
        //check if option is selected and its not default (selectedOption=true, option.default=false)
        if (selectedOption && !option.default) {
          //add option price to price variable
          price += option.price;
        }
        //check if option is not selected and its default (selectedOption=false, option.default=true)
        else if (!selectedOption && option.default) {
          //reduce price variable
          price -= option.price;
        }
        //find image with class .paramId-optionId in div with images (thisProduct.imageWrapper)
        const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        //console.log('optionImage', optionImage);
        //check if the image is found, if(optionImage is true a.k.a is found)then this happens{}
        if (optionImage) {
          //check if it is also selected option (if selectedOption is true) then this happens{}
          if (selectedOption) {
            //add class active to classList of the found image
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
          //if option is not selected (selectedOption = false) a.k.a negation of selectedOption is true then this happens{}
          if (!selectedOption) {
            //remove class active from classList of the found image
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }
    thisProduct.priceSingle = price;
    //multiply price by amount
    price *= thisProduct.amountWidget.value;

    thisProduct.priceTotal = price;
    //update calculated price in the HTML
    thisProduct.priceElem.innerHTML = price;
  }
  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function () {
      thisProduct.processOrder();
    });
  }
  addToCart() {
    const thisProduct = this;
    //app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      }
    });

    thisProduct.element.dispatchEvent(event);
  }
  prepareCartProduct() {
    const thisProduct = this;
    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      // fix priceTotal: thisProduct.priceSingle *= thisProduct.amountWidget.value,
      price: thisProduct.priceTotal,
      params: thisProduct.prepareCartProductParams()
    };
    //console.log('productSummary', productSummary);
    return productSummary;
  }
  prepareCartProductParams() {
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};
    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      params[paramId] = {
        label: param.label,
        options: {}
      };
      for (let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if (optionSelected) {
          params[paramId].options[optionId] = option.label;
        }
      }
    }
    return params;
  }
}

export default Product;
