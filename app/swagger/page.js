'use client'; // Đánh dấu đây là Client Component

import 'swagger-ui-react/swagger-ui.css';
import SwaggerUI from 'swagger-ui-react';

function ApiDocPage() {
    return (
        <section className="bg-white p-4">
            <SwaggerUI url="/api/doc" />
        </section>
    );
}

export default ApiDocPage;