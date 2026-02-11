[**@opsimathically/safe**](../README.md)

***

[@opsimathically/safe](../README.md) / safe

# Function: safe()

> **safe**\<`ActionType`, `ErrorType`\>(`action`, `types`, `transformer?`): `Safe`\<`ActionType`, `ErrorType`\>

Defined in: safe.ts:95

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
