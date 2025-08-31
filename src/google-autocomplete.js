import { Loader } from '@googlemaps/js-api-loader';
import './google-autocomplete.css';

class GoogleAutoComplete {
  constructor(element, options = {}) {
    // 验证元素
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('GoogleAutoComplete requires a valid HTML element');
    }

    // 默认配置
    this.options = {
      apiKey: options.apiKey,
      placeholder: options.placeholder || "please enter a address",
      iso2: options.iso2 || "",
      language: options.language || (localStorage.getItem('lang') || 'en'),
      fields: options.fields || ['displayName', 'formattedAddress', 'location', 'addressComponents'],
      onSelect: options.onSelect || (() => { }),
      onInput: options.onInput || (() => { }),
      onChange: options.onChange || (() => { }),
      onFocus: options.onFocus || (() => { }),
      onBlur: options.onBlur || (() => { }),
      isDisabled: options.isDisabled || false,
      ...options
    };

    this.element = element;
    this.input = null;
    this.resultsContainer = null;
    this.loader = null;
    this.google = null;
    this.newestRequestId = 0;
    this.showResult = false;

    // 请求对象
    this.request = {
      input: '',
      includedRegionCodes: this.options.iso2 ? [this.options.iso2.toLowerCase()] : [],
      language: this.options.language,
    };

    this.init();
  }

  init() {
    this.createWrapper();
    this.bindEvents();
    this.initGoogleAutoComplete();
  }

  createWrapper() {
    // 清空原有内容
    this.element.innerHTML = '';

    // 添加类名
    this.element.classList.add('cuteid-auto-complete-wrapper');

    // 创建输入框
    this.input = document.createElement('input');
    this.input.id = 'cuteid-input-auto-complete';
    this.input.type = 'text';
    this.input.className = 'cuteid-input-auto-complete';
    this.input.placeholder = this.options.placeholder;
    this.input.disabled = this.options.isDisabled;

    // 创建结果容器
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.id = 'cuteid-results';
    this.resultsContainer.className = 'cuteid-results-container';
    this.resultsContainer.style.display = 'none';

    // 创建后缀容器
    const suffix = document.createElement('section');
    suffix.className = 'cuteid-suffix';

    // 添加到wrapper
    this.element.appendChild(this.input);
    this.element.appendChild(this.resultsContainer);
    this.element.appendChild(suffix);
  }

  bindEvents() {
    // 输入事件
    this.input.addEventListener('input', (e) => this.makeAutocompleteRequest(e));

    // 焦点事件
    this.input.addEventListener('focus', (e) => this.handleFocus(e));
    this.input.addEventListener('blur', (e) => this.options.onBlur(e));

    // 变化事件
    this.input.addEventListener('change', (e) => this.options.onChange(e.target.value));

    // ESC键隐藏结果
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.hideResults();
      }
    });

    // 全局点击事件
    document.addEventListener('click', (e) => this.handleGlobalClick(e));
  }

  async initGoogleAutoComplete() {
    if (this.options.isDisabled) return;

    try {
      // 只在第一次调用时创建 Loader 实例
      if (!this.loader) {
        this.loader = new Loader({
          apiKey: this.options.apiKey,
          version: 'weekly',
          libraries: ['places']
        });
      }

      this.google = await this.loader.load();
      this.refreshToken();
    } catch (error) {
      console.error('加载 Google Maps API 失败:', error);
    }
  }

  // 刷新会话token的辅助函数
  refreshToken() {
    if (this.google && this.google.maps && this.google.maps.places) {
      // 创建新的会话token并将其添加到请求中
      this.request.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
    }
  }

  async onPlaceSelected(place) {
    // 使用配置的 fields 获取数据
    await place.fetchFields({ fields: this.options.fields });

    this.input.value = place.formattedAddress || place.displayName || '';

    this.hideResults();
    // 直接返回整个 place 对象，让页面自行处理数据
    this.options.onSelect(place);
  }

  async makeAutocompleteRequest(inputEvent) {

    this.resultsContainer.innerHTML = '';

    if (inputEvent.target.value === '') {
      this.hideResults();
    } else {
      this.request.input = inputEvent.target.value;
      const requestId = ++this.newestRequestId;

      try {
        const { suggestions } = await this.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(this.request);

        if (requestId !== this.newestRequestId) return;

        // 只有在有结果时才显示容器
        if (suggestions.length > 0) {
          this.showResults();
          
          for (const suggestion of suggestions) {
            const placePrediction = suggestion.placePrediction;
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'cuteid-suggestion-item';

            // 创建主文本
            const mainText = document.createElement('div');
            mainText.className = 'cuteid-suggestion-main-text';
            mainText.textContent = placePrediction.text.toString();
            suggestionItem.appendChild(mainText);

            if (placePrediction.secondaryText) {
              const secondaryText = document.createElement('div');
              secondaryText.className = 'cuteid-suggestion-secondary-text';
              secondaryText.textContent = placePrediction.secondaryText.toString();
              suggestionItem.appendChild(secondaryText);
            }

            suggestionItem.addEventListener('click', (event) => {
              // 阻止事件冒泡，避免触发全局点击事件
              event.stopPropagation();
              this.onPlaceSelected(placePrediction.toPlace());
            });

            this.resultsContainer.appendChild(suggestionItem);
          }
        } else {
          // 没有结果时隐藏容器，不显示任何内容
          this.hideResults();
        }
      } catch (error) {
        console.error('获取建议失败:', error);
        // 错误时也隐藏容器，不显示错误信息
        this.hideResults();
      }
    }

    this.options.onInput(inputEvent.target.value);
  }

  handleGlobalClick(event) {
    // 检查点击是否在组件外部
    if (!this.element.contains(event.target)) {
      this.hideResults();
    }
  }

  handleFocus(e) {
    // 只有在输入框有内容时才触发自动完成请求
    if (e.target.value.trim() !== '') {
      this.makeAutocompleteRequest(e);
    }
    this.options.onFocus(e);
  }

  showResults() {
    this.showResult = true;
    this.resultsContainer.style.display = 'block';
  }

  hideResults() {
    this.showResult = false;
    this.resultsContainer.style.display = 'none';
  }

  // 公共方法
  setValue(value) {
    this.input.value = value;
  }

  getValue() {
    return this.input.value;
  }

  setPlaceholder(placeholder) {
    this.input.placeholder = placeholder;
  }

  setDisabled(disabled) {
    this.input.disabled = disabled;
    this.options.isDisabled = disabled;
  }

  updateRegion(iso2) {
    this.options.iso2 = iso2;
    this.request.includedRegionCodes = iso2 ? [iso2.toLowerCase()] : [];
  }

  // 销毁方法
  destroy() {
    document.removeEventListener('click', this.handleGlobalClick);
    this.element.innerHTML = '';
    this.element.classList.remove('cuteid-auto-complete-wrapper');
  }
}

// 全局函数，用于创建实例
function googleAutoComplete(element, options) {
  return new GoogleAutoComplete(element, options);
}

// 导出
export { GoogleAutoComplete, googleAutoComplete };

// 如果在浏览器环境中，将函数添加到全局对象
if (typeof window !== 'undefined') {
  window.GoogleAutoComplete = GoogleAutoComplete;
  window.googleAutoComplete = googleAutoComplete;
} 