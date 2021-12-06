class Inventory {
    check_bin = (warehouse, bin, qty, cost) => {
        return cy.check_bin(warehouse, bin, qty, cost);
    }
}

export default Inventory;
