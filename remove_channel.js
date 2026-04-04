const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/CheckoutPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startStr = '                 {/* Channel Selection */}';
const endStr = '                 </div>\n             </div>';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + '             </div>' + content.substring(endIndex);
    fs.writeFileSync(filePath, content);
    console.log('Successfully removed Channel Selection block');
} else {
    console.log('Could not find start or end string');
}
