declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ZHIPU_API_KEY: string;
    }
  }
}

export {} 