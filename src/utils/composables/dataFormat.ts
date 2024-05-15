export default function dataFormat(){
    function formatDate(dateString:string)
    {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }
        const dateObject = new Date(dateString)
        const formattedDate = dateObject.toLocaleDateString('zh-CN', options)
        return formattedDate.replace(/\//g, '年').replace('-', '月') + '日'
    }

    return {
        formatDate
    }
}
