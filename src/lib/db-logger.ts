import { neon } from '@neondatabase/serverless';

export function createLoggedSql(connectionString: string) {
  const sql = neon(connectionString);
  
  // Return the sql function with logging wrapper
  return new Proxy(sql, {
    apply: (target, thisArg, argArray) => {
      const [query, ...params] = argArray;
      console.log('🔍 SQL Query:', query);
      if (params.length > 0) {
        console.log('📋 SQL Params:', params);
      }
      return target.apply(thisArg, argArray);
    }
  }) as typeof sql;
}