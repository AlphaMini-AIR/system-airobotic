import { Suspense } from 'react';
import { form_data, user_data, label_data, zalo_data } from "@/data/actions/get";
import { getCombinedData } from "../actions/customer.actions";
import checkAuthToken from "@/utils/checktoken";
import CustomerView from './index';
import { variant_data } from '../actions/variant.actions';
import { getRunningSchedulesAction } from '../actions/schedule.actions';

function PageSkeleton() {
    return <div>Đang tải trang...</div>;
}

export default async function Page({ searchParams }) {
    const [initialResult, userAuth, sources, label, zalo, users, variant, running] = await Promise.all([
        getCombinedData(await searchParams),
        checkAuthToken().then(auth => user_data({ _id: auth.id })),
        form_data(),
        label_data(),
        zalo_data(),
        user_data({}),
        variant_data(),
        getRunningSchedulesAction()
    ]);

    const reversedLabel = [...label].reverse();

    return (
        <Suspense fallback={<PageSkeleton />}>
            <CustomerView
                initialResult={initialResult}
                user={userAuth}
                sources={sources}
                labelData={reversedLabel}
                formData={sources}
                zaloData={zalo}
                users={users}
                variant={variant}
                running={running.data}
            />
        </Suspense>
    );
}