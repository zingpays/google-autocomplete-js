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
      remote: options.remote || false, // 新增remote参数，默认为false
      remoteUrl: options.remoteUrl || 'https://feplaces.legendtrading.com/places/', // 远程服务地址
      debounceDelay: options.debounceDelay !== undefined ? options.debounceDelay : 500, // 防抖延迟时间，默认500ms
      // 样式配置
      inputClass: options.inputClass || 'google-map-input-auto-complete',
      inputStyle: options.inputStyle || {},
      resultsClass: options.resultsClass || 'google-map-results-container',
      resultsStyle: options.resultsStyle || {},
      wrapperClass: options.wrapperClass || 'google-map-auto-complete-wrapper',
      ...options
    };

    this.element = element;
    this.input = null;
    this.resultsContainer = null;
    this.loader = null;
    this.google = null;
    this.newestRequestId = 0;
    this.showResult = false;
    this.debounceTimeout = null; // 防抖定时器

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
    this.element.classList.add('google-map-auto-complete-wrapper');
    this.element.classList.add(this.options.wrapperClass);

    // 创建输入框
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = this.options.inputClass;
    this.input.placeholder = this.options.placeholder;
    this.input.disabled = this.options.isDisabled;
    
    // 应用自定义样式
    Object.assign(this.input.style, this.options.inputStyle);

    // 创建结果容器
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = this.options.resultsClass;
    this.resultsContainer.style.display = 'none';
    
    // 应用自定义样式
    Object.assign(this.resultsContainer.style, this.options.resultsStyle);

    // 添加到wrapper
    this.element.appendChild(this.input);
    this.element.appendChild(this.resultsContainer);
  }

  bindEvents() {
    // 输入事件 - 添加防抖
    this.input.addEventListener('input', (e) => {
      // 清除之前的定时器
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      // 设置新的定时器
      this.debounceTimeout = setTimeout(() => {
        this.makeAutocompleteRequest(e);
      }, this.options.debounceDelay);
    });

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

  // 调用远程服务的方法
  async callRemoteService(input) {
    try {
      const params = new URLSearchParams({
        input: input,
        languageCode: this.options.language,
        regionCode: this.options.iso2 || undefined,
        includeQueryPredictions: 'true'
      });

      // 移除undefined参数
      for (const [key, value] of params.entries()) {
        if (value === 'undefined') {
          params.delete(key);
        }
      }

      const response = await fetch(`${this.options.remoteUrl}autocomplete?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理legend-places服务的响应格式
      // legend-places使用响应拦截器，返回格式为: { success: true, code: "100000", message: "", data: [{ suggestions: [...] }] }
      if (data.success && data.data && data.data.length > 0) {
        return data.data[0]; // 返回data数组中的第一个元素，它包含suggestions
      }
      
      // 如果不是legend-places格式，直接返回原始数据
      return data;
    } catch (error) {
      console.error('调用远程服务失败:', error);
      throw error;
    }
  }

  async onPlaceSelected(place) {
    try {
      // 使用配置的 fields 获取数据
      await place.fetchFields({ fields: this.options.fields });

      this.input.value = place.formattedAddress || place.displayName || '';

      this.hideResults();
      // 直接返回整个 place 对象，让页面自行处理数据
      this.options.onSelect(place);
    } catch (error) {
      console.error('处理选中地点失败:', error);
      // 即使处理失败，也要隐藏结果容器
      this.hideResults();
    }
  }

  async makeAutocompleteRequest(inputEvent) {

    this.resultsContainer.innerHTML = '';

    if (inputEvent.target.value === '') {
      this.hideResults();
    } else {
      const requestId = ++this.newestRequestId;

      try {
        let suggestions = [];

        if (this.options.remote) {
          // 使用远程服务
          const data = await this.callRemoteService(inputEvent.target.value);
          suggestions = data.suggestions || [];
        } else {
          // 使用Google Maps API
          // 检查Google服务是否可用
          if (!this.google || !this.google.maps || !this.google.maps.places) {
            console.warn('Google Maps API 不可用，跳过自动完成请求');
            this.hideResults();
            this.options.onInput(inputEvent.target.value);
            return;
          }

          this.request.input = inputEvent.target.value;
          const { suggestions: googleSuggestions } = await this.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(this.request);
          suggestions = googleSuggestions;
        }

        if (requestId !== this.newestRequestId) return;

        // 只有在有结果时才显示容器
        if (suggestions.length > 0) {
          this.showResults();
          
          for (const suggestion of suggestions) {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'google-map-suggestion-item';

            if (this.options.remote) {
              // 处理远程服务的响应格式
              this.handleRemoteSuggestion(suggestion, suggestionItem);
            } else {
              // 处理Google Maps API的响应格式
              this.handleGoogleSuggestion(suggestion, suggestionItem);
            }

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

  // 处理Google Maps API的响应格式
  handleGoogleSuggestion(suggestion, suggestionItem) {
    const placePrediction = suggestion.placePrediction;
    
    // 创建主文本
    const mainText = document.createElement('div');
    mainText.className = 'google-map-suggestion-main-text';
    mainText.textContent = placePrediction.text.toString();
    suggestionItem.appendChild(mainText);

    if (placePrediction.secondaryText) {
      const secondaryText = document.createElement('div');
      secondaryText.className = 'google-map-suggestion-secondary-text';
      secondaryText.textContent = placePrediction.secondaryText.toString();
      suggestionItem.appendChild(secondaryText);
    }

    suggestionItem.addEventListener('click', (event) => {
      // 阻止事件冒泡，避免触发全局点击事件
      event.stopPropagation();
      this.onPlaceSelected(placePrediction.toPlace());
    });
  }

  // 处理远程服务的响应格式
  handleRemoteSuggestion(suggestion, suggestionItem) {
    if (suggestion.placePrediction) {
      // 处理地点预测
      const placePrediction = suggestion.placePrediction;
      
      // 创建主文本
      const mainText = document.createElement('div');
      mainText.className = 'google-map-suggestion-main-text';
      mainText.textContent = placePrediction.text.text;
      suggestionItem.appendChild(mainText);

      suggestionItem.addEventListener('click', (event) => {
        // 阻止事件冒泡，避免触发全局点击事件
        event.stopPropagation();
        this.onRemotePlaceSelected(placePrediction);
      });
    } else if (suggestion.queryPrediction) {
      // 处理查询预测
      const queryPrediction = suggestion.queryPrediction;
      
      // 创建主文本
      const mainText = document.createElement('div');
      mainText.className = 'google-map-suggestion-main-text';
      mainText.textContent = queryPrediction.text.text;
      suggestionItem.appendChild(mainText);

      suggestionItem.addEventListener('click', (event) => {
        // 阻止事件冒泡，避免触发全局点击事件
        event.stopPropagation();
        this.onRemoteQuerySelected(queryPrediction);
      });
    }
  }

  // 处理远程服务地点选择
  async onRemotePlaceSelected(placePrediction) {
    try {
      // 获取地点详情
      const placeId = placePrediction.place;
      const detailsResponse = await fetch(`${this.options.remoteUrl}details?placeId=${placeId}&languageCode=${this.options.language}&regionCode=${this.options.iso2 || ''}`);
      
      if (!detailsResponse.ok) {
        throw new Error(`HTTP error! status: ${detailsResponse.status}`);
      }
      
      const detailsData = await detailsResponse.json();
      
      // 处理legend-places服务的响应格式
      let place;
      if (detailsData.success && detailsData.data && detailsData.data.length > 0) {
        place = detailsData.data[0].result; // legend-places格式: data[0].result
      } else {
        place = detailsData.result; // 直接格式
      }
      
      // 设置输入框值
      this.input.value = place.formattedAddress || place.displayName.text || '';
      
      this.hideResults();
      
      // 构造类似Google API的place对象
      const placeObject = {
        formattedAddress: place.formattedAddress,
        displayName: place.displayName.text,
        location: place.location,
        addressComponents: place.addressComponents,
        placeId: place.id,
        types: place.types,
        rating: place.rating,
        userRatingCount: place.userRatingCount
      };
      
      this.options.onSelect(placeObject);
    } catch (error) {
      console.error('处理远程地点选择失败:', error);
      this.hideResults();
    }
  }

  // 处理远程服务查询选择
  onRemoteQuerySelected(queryPrediction) {
    // 对于查询预测，直接设置输入框值
    this.input.value = queryPrediction.text.text;
    this.hideResults();
    this.options.onSelect({ query: queryPrediction.text.text });
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

  // 样式更新方法
  updateInputStyle(style) {
    Object.assign(this.input.style, style);
  }

  updateResultsStyle(style) {
    Object.assign(this.resultsContainer.style, style);
  }

  updateInputClass(className) {
    this.input.className = className;
  }

  updateResultsClass(className) {
    this.resultsContainer.className = className;
  }

  // 销毁方法
  destroy() {
    // 清除防抖定时器
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    document.removeEventListener('click', this.handleGlobalClick);
    this.element.innerHTML = '';
    this.element.classList.remove(this.options.wrapperClass);
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