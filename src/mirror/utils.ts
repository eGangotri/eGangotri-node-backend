const DEFAULT_COUNT_FOR_ELLIPSIS = 20;

export const PERCENT_SIGN_AS_FILE_SEPARATOR = "%"
export const ellipsis = (
  input: string|number,
  alphabetCount = DEFAULT_COUNT_FOR_ELLIPSIS
) => {
  const inputAsString = input.toString();
  return inputAsString.length > alphabetCount
    ? `${inputAsString.substring(0, alphabetCount)}...`
    : input;
};

export const makePostCall = async (body: Record<string, unknown>, resource: string) => {
  const requestOptions: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  try {
    console.log(`going to fetch(${resource}) with body ${JSON.stringify(body)}`)
    const response = await fetch(resource, requestOptions);
    console.log(`response ${JSON.stringify(response)}`)
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    else {
      console.log(`response not ok ${response.statusText}`)
      return {
        success: false,
        error: response.statusText
      };
    }
  }
  catch (error) {
    const err = error as Error;
    console.log(`catch err ${err.message}`)
    return {
      success: false,
      error: "Exception thrown. May be Backend Server down."+ err.message
    };
  }
  console.log(`response not ok`)
  return {
    error: {
      success: false,
    }
  }
};


export function isNumber(value: any): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}
