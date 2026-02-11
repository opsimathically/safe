[**@opsimathically/safe**](../README.md)

***

[@opsimathically/safe](../README.md) / safe

# Function: safe()

> **safe**\<`ActionType`, `ErrorType`\>(`action`, `types`, `transformer?`): `Safe`\<`ActionType`, `ErrorType`\>

Defined in: [safe.ts:95](https://github.com/opsimathically/safe/blob/b4d241307b44c5ab42001a2a72e2ef3a670b741c/src/safe/safe.ts#L95)

## Type Parameters

### ActionType

`ActionType` *extends* (...`args`) => `any`

### ErrorType

`ErrorType` = `Error`

## Parameters

### action

`ActionType`

### types

`ErrorConstructor`[] = `[]`

### transformer?

(`error`) => `ErrorType` \| `Promise`\<`ErrorType`\>

## Returns

`Safe`\<`ActionType`, `ErrorType`\>
