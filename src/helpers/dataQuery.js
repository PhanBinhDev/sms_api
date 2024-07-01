class DataQuery {
  constructor(data) {
    this.data = data
  }

  // filter
  filterData(criteria) {
    // const filteredData = this.data.filter((item) => {
    //   return Object.keys(criteria).every((key) => {
    //     if (typeof criteria[key] === 'object' && criteria[key].$regex) {
    //       return new RegExp(criteria[key].$regex, 'i').test(item, [key])
    //     }
    //     return item[key] === criteria[key]
    //   })
    // })
    // return filteredData
  }

  // sort
  sortData(data, criteria) {}

  // pagination
  paginateData(data, page, size) {}
}
