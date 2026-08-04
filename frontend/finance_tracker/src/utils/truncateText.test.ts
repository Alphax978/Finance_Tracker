import {truncateText} from "./truncateText"

describe("truncateText",() => {
    it ("returns short text unchanged",() => {
        const result = truncateText("hey",20)
        expect(result).toBe("hey")
        
    })

    it("handles empty string",() => {
        const result = truncateText("",20)
        expect(result).toBe("")

    })


    it("truncates the long text and appends an ellipsis",() => {
        const result = truncateText("I want to get as far away from here as I can",20)
        expect(result).toBe("I want to get as far ...")
    })

    it ("handles exact boundary length",() => {
        const result =  truncateText("I want to leave now!",20)
        expect(result).toBe("I want to leave now!")
    })
})

