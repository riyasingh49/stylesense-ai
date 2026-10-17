export interface LangSearchWebPage {
    name?: unknown;
    url?: unknown;
    snippet?: unknown;
    text?: unknown;
    datePublished?: unknown;
  }
  
  export interface LangSearchWebPages {
    value?: LangSearchWebPage[];
  }
  
  export interface LangSearchData {
    webPages?: LangSearchWebPages;
  }
  
  export interface LangSearchApiResponse {
    code?: string | number;
    message?: string;
    data?: LangSearchData;
  }
  